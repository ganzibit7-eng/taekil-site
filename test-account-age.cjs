const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('account-age.js','utf8');
const tick = () => new Promise(setImmediate);
function fixture(records = new Map()) {
  const state = {user:{uid:'google-1'}, failRead:false, failSave:false, writes:0, opens:0};
  const label = {}, checkbox = {closest:()=>label,focus(){}},nodes={authAgeConfirmed:checkbox,authTitle:{},authError:{style:{}},authOverlay:{getClientRects:()=>[]}};
  const providers=[{},{}], modes=['signup','login'].map(authMode=>({dataset:{authMode},setAttribute(){}}));
  const storage=new Map();const localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
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
  const ctx={window:{firebase},firebase,db,localStorage,sessionStorage:localStorage,showToast(){},clearLocalKakaoSessionForBan(){},document:{getElementById:id=>nodes[id],querySelectorAll:s=>s.includes('mode')?modes:providers}};
  vm.runInNewContext(source,ctx);
  const gate=ctx.window.TaekilAccountAge;
  return {gate,state,checkbox,providers,modes,login:async(intent)=>gate.connect(async()=>({user:state.user}),intent),
    check:()=>{checkbox.checked=true;checkbox.onchange();},ensure:()=>gate.ensure(state.user)};
}
test('signup providers require an explicit check before authentication; only the returned account is recorded',async()=>{
  const records=new Map(),f=fixture(records);
  assert.equal(f.gate.entry(),null);assert(f.providers.every(p=>p.disabled));
  f.check();const intent=f.gate.entry();assert.equal(intent,'signup');assert(f.providers.every(p=>!p.disabled));
  let resolvePopup;const provider=f.gate.connect(()=>new Promise(resolve=>resolvePopup=resolve),intent);
  const listener=f.ensure();await tick();assert.equal(records.size,0);
  resolvePopup({user:f.state.user});await provider;
  assert(await listener);assert.equal(f.state.writes,1);
  const fresh=fixture(records);fresh.modes[1].onclick();assert.equal(fresh.gate.entry(),'login');
  assert(await fresh.ensure());assert.equal(fresh.checkbox.checked,false);assert.equal(fresh.state.writes,0);
});
test('existing-member login cannot register an unchecked new account',async()=>{
  const f=fixture();f.modes[1].onclick();await f.login(f.gate.entry());
  assert.equal(await f.ensure(),false);assert.equal(f.state.user,null);assert.equal(f.state.writes,0);
});
test('Kakao redirect intent is state-bound and consumed once; a cancelled Google popup cannot approve a later login',async()=>{
  const f=fixture();f.gate.rememberRedirect('a','signup');assert.equal(f.gate.takeRedirect('b'),'login');
  f.gate.rememberRedirect('a','signup');assert.equal(f.gate.takeRedirect('a'),'signup');assert.equal(f.gate.takeRedirect('a'),'login');
  await assert.rejects(f.gate.connect(async()=>{throw Error('cancel');},'signup'));
  assert.equal(await f.ensure(),false);assert.equal(f.state.writes,0);
});
test('a failed record write or a switched identity never passes the account check',async()=>{
  const f=fixture();f.check();await f.login(f.gate.entry());f.state.failSave=true;
  assert.equal(await f.ensure(),false);assert.equal(f.state.writes,0);
  const g=fixture();g.check();await g.login(g.gate.entry());g.state.user={uid:'somebody-else'};g.gate.observe(g.state.user.uid);
  assert.equal(await g.ensure(),false);assert.equal(g.state.writes,0);
});
