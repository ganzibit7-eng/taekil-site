const {test} = require('node:test');
const assert = require('node:assert/strict');
const C = require('./consultation-draft-core.js');
const sample = () => ({version:1,at:1000,owner:'',awaitingAuth:true,step:5,values:{ProfileName:'예시',Year:'1990',Month:'1',Day:'1',Gender:'unknown',Hour:'unknown',CalType:'solar',Relation:'본인'},question:'이직을 고민해요',leap:false});
test('explicit guest sign-in preserves all birth inputs and question across redirect', () => {
  const restored = C.read(JSON.stringify(sample()), 2000, 'member-a');
  assert.deepEqual(restored.values, sample().values);
  assert.equal(restored.question, sample().question);
  assert.equal(restored.step, 5);
});
test('a draft from another member or signed-out member is discarded', () => {
  const draft = {...sample(),owner:'member-a'};
  assert.equal(C.read(draft,2000,'member-b'),null);
  assert.equal(C.read(draft,2000,''),null);
  assert.ok(C.read(draft,2000,'member-a'));
});
test('unrequested guest draft is not transferred to an account', () => {
  const draft = {...sample(),awaitingAuth:false};
  assert.equal(C.read(draft,2000,'member-a'),null);
  assert.ok(C.read(draft,2000,''));
});
test('expired, future, corrupted and malformed drafts cannot resume', () => {
  for (const draft of ['invalid',null,{}, {...sample(),version:2}, {...sample(),values:null}]) assert.equal(C.read(draft,2000,''),null);
  assert.equal(C.read(sample(),1000+C.ttl+1,''),null);
  assert.equal(C.read(sample(),999,''),null);
});
test('draft strings and step are bounded and unknown fields excluded', () => {
  const draft=sample();draft.values.ProfileName='가'.repeat(100);draft.values.token='secret';draft.question='나'.repeat(1000);draft.step=500;
  const result=C.read(draft,2000,'');
  assert.equal(result.values.ProfileName.length,20);assert.equal(result.question.length,200);
  assert.equal(result.step,5);assert.equal(result.values.token,undefined);
});
test('numeric birthday input accepts compact or separated dates without inventing missing digits', () => {
  assert.deepEqual(C.birth('19900101'),{text:'1990.01.01',complete:true,y:'1990',m:'1',d:'1'});
  assert.deepEqual(C.birth('1990-01-01'),C.birth('19900101'));
  assert.equal(C.birth('19900').complete,false);
  assert.equal(C.birth('19900').m,'');
  assert.equal(C.birth('20000229').d,'29');
  assert.equal(C.birth('20000230').d,'30'); // Calendar validation must reject, never silently roll forward.
  assert.equal(C.birth('1990010199').text,'1990.01.01');
});
test('partial birthday text survives a tab reload and follows the same account and expiry rules', () => {
  const draft={...sample(),birthText:'1990.0',step:1};
  assert.equal(C.read(JSON.stringify(draft),2000,'').birthText,'1990.0');
  assert.equal(C.read({...draft,owner:'member-a'},2000,'member-b'),null);
  assert.equal(C.read(draft,1000+C.ttl+1,''),null);
});
