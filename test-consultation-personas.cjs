const assert = require('node:assert/strict');
const {readFileSync, existsSync} = require('node:fs');
const {test} = require('node:test');
const vm = require('node:vm');
const personas = require('./consultation-personas.js');
const reading = require('./consultation-experience-core.js');
const draft = require('./consultation-draft-core.js');
const html = readFileSync('index.html','utf8').replace(/\r\n/g,'\n');

test('every home consultation topic restores to its designated advisor and a local portrait', () => {
  const topics = [...html.matchAll(/data-consultation-topic="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(topics).size,topics.length);
  assert.equal(new Set(topics.map(topic=>personas.forTopic(topic).id)).size, topics.length);
  assert.equal(new Set(topics.map(topic=>personas.forTopic(topic).portrait)).size, topics.length);
  for(const topic of topics) {
    assert.equal(draft.normalizeTopic(topic),topic);
    const advisor = personas.forTopic(topic);
    assert.notEqual(advisor.id,'yeonwoo');
    assert.equal(advisor.questions.length,3);
    assert.ok(existsSync(advisor.portrait));
  }
  assert.equal(personas.forTopic('reunion').name,'이준');
  assert.equal(personas.forTopic('saving').name,'다온');
  assert.equal(personas.forTopic('side-job').name,'태율');
  assert.equal(personas.forTopic('wedding').name,'소담');
});

test('the conversation and its rendered record carry the advisor and legacy records remain Yeonwoo', () => {
  const source = ['function sanitizeAiConversationSubject(', 'function buildCurrentAiConversationRecord(', 'function renderAiConversationHistory(', 'function resumeAiConversation(', 'function restoreActiveAiConversation(']
    .map(marker=>html.slice(html.indexOf(marker)).match(/^[^]*?\n}/)[0]).join('\n');
  const records = [{id:'dy',consultantId:'dogyeom',messages:[{role:'user',content:'지출'}]}, {id:'legacy',messages:[{role:'assistant',content:'지난 답변'}]}];
  const nodes = new Map();
  const context = vm.createContext({
    window:{TaekilConsultationPersonas:personas,__aiConversationId:'dy',__aiConsultantId:'dogyeom',__aiChatHistory:records[0].messages},
    document:{getElementById(id){if(!nodes.has(id))nodes.set(id,{style:{}});return nodes.get(id);}},
    accountStore:{snapshot:()=>({owner:'tester'})},getAiConversationStore:()=>records,
    getActiveAiSession:()=>({id:'dy',ownerKey:'tester'}),getCurrentUserKey:()=> 'tester',
    setActiveAiSession(){},goTo(){},setTimeout(){},escapeHtml:String
  });
  vm.runInContext(source,context);
  assert.equal(context.buildCurrentAiConversationRecord().consultantId,'dogyeom');
  context.renderAiConversationHistory();
  assert.match(nodes.get('aiConversationHistoryList').innerHTML,/도겸 상담/);
  assert.match(nodes.get('aiConversationHistoryList').innerHTML,/연우 상담/);
  context.resumeAiConversation('legacy');
  assert.equal(context.window.__aiConsultantId,'yeonwoo');
  assert.equal(context.restoreActiveAiConversation(),true);
  assert.equal(context.window.__aiConsultantId,'dogyeom');
});

test('specialist followups fit the current topic while retaining deduplication and ordinary followups', () => {
  for(const [id,question,pattern] of [
    ['seohwa','재회가 고민돼요',/첫 문장/],['dogyeom','소비가 걱정돼요',/반복 지출/],
    ['mujin','업무 환경을 바꿀까요?',/결정권/],['sodam','예식 날짜가 고민돼요',/생활 기준/]
  ]) {
    const [first] = reading.followups(question,'',[],id);
    assert.match(first,pattern);
    assert.ok(!reading.followups(question,'',[{role:'user',content:first}],id).includes(first));
    assert.notEqual(reading.followups(question,'',[],'yeonwoo')[0],first);
  }
  assert.deepEqual(reading.followups('이직','',[], 'seohwa'),reading.followups('이직','',[],'yeonwoo'));
});
