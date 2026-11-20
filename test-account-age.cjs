const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('account-age.js','utf8');
const tick = () => new Promise(setImmediate);
function fixture(records = new Map()) {
  const state = {user:{uid:'google-1'}, failRead:false, failSave:false, writes:0, opens:0};
  const submit = {}, cancel = {}, label = {}, status = {}, checkbox = {closest:()=>label};
  const form = {querySelector:s=>s.includes('submit')?submit:cancel};
  const dialog = {querySelector:s=>s==='form'?form:status,addEventListener(){},
    showModal(){dialog.open=true;state.opens++;},close(){dialog.open=false;}};
  const auth = {get currentUser(){return state.user;},signOut:async()=>{state.user=null;}};
  const firebase = {auth:()=>auth,firestore:{FieldValue:{serverTimestamp:()=>1}}};
  const ref = uid => ({uid,get:async()=>{
    if(state.failRead)throw Error();
    return {exists:records.has(uid),data:()=>records.get(uid)};
  }});
  const db={collection:()=>({doc:uid=>({collection:()=>({doc:()=>ref(uid)})})}),runTransaction:async fn=>{
    if(state.failSave)throw Error();
    await fn({get:r=>r.get(),set:(r,data)=>{records.set(r.uid,data);state.writes++;}});
  }};
  const ctx={window:{firebase},firebase,db,clearLocalKakaoSessionForBan(){},document:{getElementById:id=>id==='accountAgeDialog'?dialog:checkbox}};
  vm.runInNewContext(source,ctx);
  const gate=ctx.window.TaekilAccountAge;
  return {gate,state,dialog,cancel,submit,status,label,checkbox,ensure:()=>gate.ensure(state.user),
    accept:async()=>{checkbox.checked=true;checkbox.onchange();await form.onsubmit({preventDefault(){}});},
    click:()=>form.onsubmit({preventDefault(){}})};
}
test('first account explicitly confirms once, reload and another device read its record, another account starts unchecked',async()=>{
  const records=new Map(),f=fixture(records),first=f.ensure(),concurrent=f.ensure();
  await tick();assert.equal(f.state.opens,1);assert.equal(f.checkbox.checked,false);assert.equal(f.submit.disabled,true);
  await f.click();assert.equal(f.state.writes,0);
  await f.accept();assert(await first);assert(await concurrent);assert.equal(f.state.writes,1);
  const fresh=fixture(records);assert(await fresh.ensure());assert.equal(fresh.state.opens,0);
  fresh.state.user={uid:'kakao_2'};fresh.gate.observe('kakao_2');assert.equal(fresh.gate.confirmed(),false);
  const second=fresh.ensure();await tick();assert.equal(fresh.checkbox.checked,false);
  fresh.cancel.onclick();assert.equal(await second,false);assert.equal(records.has('kakao_2'),false);
});
test('failed read and save do not approve membership, a retry can complete it',async()=>{
  const f=fixture();f.state.failRead=true;const result=f.ensure();await tick();assert(f.label.hidden);
  assert(!f.gate.confirmed());f.state.failRead=false;await f.click();assert(!f.label.hidden);
  f.state.failSave=true;await f.accept();assert(!f.gate.confirmed());assert.equal(f.state.writes,0);
  f.state.failSave=false;await f.accept();assert(await result);assert.equal(f.state.writes,1);
});
test('switching or signing out closes the pending account prompt without saving',async()=>{
  const f=fixture();const result=f.ensure();await tick();f.state.user={uid:'next'};f.gate.observe('next');
  assert.equal(await result,false);assert.equal(f.dialog.open,false);assert.equal(f.state.writes,0);assert(!f.gate.confirmed());
});
