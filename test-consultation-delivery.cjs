const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const personas = require('./consultation-personas.js');
const experience = require('./consultation-experience-core.js');

const html = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const sendSource = html.match(/async function sendAiChatMessage\(\) \{[^]*?\n}/)[0];

test('birth date validation accepts leap day and rejects silently rolled-over dates', () => {
  const source = html.match(/function resolveBirthDate\([^]*?\n}/)[0];
  const ctx = vm.createContext({showToast() {}});
  vm.runInContext(source, ctx);
  assert.equal(ctx.resolveBirthDate('2000-02-29', 'solar', false).getDate(), 29);
  for (const date of ['1999-02-29', '2000-02-30', '2000-04-31', '2000-13-01', '2000-01-00']) {
    assert.equal(ctx.resolveBirthDate(date, 'solar', false), null);
  }
});

function fixture() {
  const input = {value:'', dispatchEvent() {}};
  const button = {disabled:false};
  const history = [];
  const requests = [];
  const window = {__aiConversationId:'fixture-conversation', __aiChatHistory:history, dispatchEvent() {}};
  const nodes = {aiChatInput:input, aiChatSendBtn:button};
  const context = {
    window, document:{getElementById:id => nodes[id] || null, querySelector:() => null},
    accountStore:{snapshot:() => 'owner-A', current:token => token === 'owner-A'},
    firebaseReady:true, firebaseAuthReady:true, firebaseAuthUser:{uid:'A'}, getKakaoUser:() => null,
    getCurrentUserKey:() => 'A', getAiRequestHeaders:async () => ({}), AI_CHAT_URL:'fixture://local',
    fetch:async (_url, opts) => {
      requests.push(JSON.parse(opts.body));
      return {ok:true, status:200, json:async () => ({reply:'답변', freeUsed:1, freeLimit:3})};
    },
    appendAiChatMessage:() => ({classList:{add() {}}, querySelector:()=>({}), remove() {}}),
    clearAiFollowupSuggestions() {}, setActiveAiSession() {}, showToast() {},
    saveCurrentAiConversation() {}, bumpDailyFunnel() {}, trackSeoConversion() {}, trackAiFunnel() {},
    appendAiInlineSpecificDateComparison:() => true, updateAiChatStatus() {}, showAiFollowups() {},
    scrollAiChatToMessageStart() {}, requestAnimationFrame() {}, setTimeout() {},
    localStorage:{getItem:() => null, setItem() {}}, CustomEvent:class {}, Event:class {},
    console:{error() {}}
  };
  vm.createContext(context);
  vm.runInContext(sendSource, context);
  return {input, button, history, context, requests};
}

test('a failed question returns as a draft and a retry sends one complete turn', async () => {
  const f = fixture();
  f.input.value = '직업 선택 기준이 궁금해요';
  const success = f.context.fetch;
  f.context.fetch = async (url, options) => {
    await success(url, options);
    return {ok:false, status:502, json:async () => ({message:'답변을 생성하지 못했습니다.'})};
  };
  await f.context.sendAiChatMessage();
  assert.equal(f.input.value, '직업 선택 기준이 궁금해요');
  assert.equal(f.history.length, 0);
  f.context.fetch = success;
  await f.context.sendAiChatMessage();
  assert.equal(f.requests.length, 2);
  assert.deepEqual(f.requests[1].history, []);
  assert.deepEqual(f.history.map(m => m.role), ['user','assistant']);
  assert.equal(f.input.value, '');
});

test('each active advisor is passed to the existing authenticated send path', async () => {
  for (const consultantId of ['seohwa','dogyeom','mujin','sodam',undefined,'unknown-id']) {
    const f = fixture();
    f.context.window.TaekilConsultationPersonas = personas;
    f.context.window.__aiConsultantId = consultantId;
    f.input.value = '확인할 조건을 알려주세요';
    await f.context.sendAiChatMessage();
    assert.equal(f.requests.length,1);
    assert.equal(f.requests[0].uid,'A');
    assert.equal(f.requests[0].consultantId,personas.get(consultantId).id);
    assert.deepEqual(f.history.map(m=>m.role),['user','assistant']);
  }
});

test('answer evidence survives the saved record and stays out of follow-up payloads', async () => {
  const f = fixture();
  const evidence = [{label:'월간 · 비견',value:'자기 기준과 동료 사이의 관계',scope:'선택한 출생정보의 계산값'}];
  const recordSource = html.match(/function buildCurrentAiConversationRecord\(\)\{[^]*?\n}/)[0];
  const record = vm.runInNewContext(recordSource+'\nbuildCurrentAiConversationRecord', {
    window:f.context.window, getAiConversationStore:()=>[], sanitizeAiConversationSubject:subject=>subject
  });
  f.context.window.TaekilExperienceCore = experience;
  let added;
  f.context.appendAiChatMessage = (role, text, opts) => {
    if(role==='assistant'&&opts?.evidence)added=opts.evidence;
    return {classList:{add() {}}, querySelector:()=>({}), remove() {}};
  };
  const send = f.context.fetch;
  f.context.fetch = async (url, opts) => {
    await send(url, opts);
    return {ok:true, status:200, json:async () => ({reply:'함께 쓰는 돈의 기준을 먼저 정해 보세요.', evidence})};
  };
  f.input.value = '돈이 새기 쉬운 곳은?';
  await f.context.sendAiChatMessage();
  assert.deepEqual(added,evidence);
  assert.deepEqual(record().messages[1].evidence,evidence);
  assert.equal(record().messages[0].evidence,undefined);

  f.input.value = '어떻게 이야기할까요?';
  await f.context.sendAiChatMessage();
  assert.deepEqual(f.requests[1].history,[
    {role:'user',content:'돈이 새기 쉬운 곳은?'},
    {role:'assistant',content:'함께 쓰는 돈의 기준을 먼저 정해 보세요.'}
  ]);
});

test('a pending question blocks Enter or button resubmission and protects a new draft', async () => {
  const f = fixture();
  let finish;
  const reply = new Promise(resolve => { finish = resolve; });
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  let requests = 0;
  f.context.fetch = () => { requests++; requested(); return reply; };
  f.input.value = '첫 질문';
  const first = f.context.sendAiChatMessage();
  await started;
  f.input.value = '새로 작성하던 질문';
  await f.context.sendAiChatMessage();
  assert.equal(requests, 1);
  finish({ok:false, status:429, json:async () => ({message:'잠시 기다려 주세요.'})});
  await first;
  assert.equal(f.input.value, '새로 작성하던 질문');
  assert.equal(f.history.length, 0);
  assert.equal(f.button.disabled, false);
});

test('capability and safety replies stay visible without entering future AI context', async () => {
  for (const data of [{restricted:true},{stopReason:'server_capability'}]) {
    const f = fixture();
    let saved = false;
    f.context.saveCurrentAiConversation = () => { saved = true; };
    f.context.fetch = async () => ({ok:true, status:200, json:async () => ({reply:'안내', ...data})});
    f.input.value = '검증용 질문';
    await f.context.sendAiChatMessage();
    assert.equal(f.history.length, 0);
    assert.equal(saved, false);
    assert.equal(f.input.value, '');
  }
});
