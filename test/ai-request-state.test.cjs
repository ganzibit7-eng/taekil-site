const test = require('node:test');
const assert = require('node:assert/strict');
const factory = require('../ai-request-state');
function storage(){const entries=new Map();return {getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};}
test('lost response and refresh reuse the exact request ID, history and payload',()=>{
  const store=storage(); let ids=0;
  const first=factory(store,()=>`request-${++ids}`);
  const original=first.begin('account:conversation:profile',{message:'이직',history:[{role:'user',content:'이직'}]});
  const refreshed=factory(store,()=>`request-${++ids}`);
  const retried=refreshed.begin('account:conversation:profile',{message:'이직',history:[{role:'user',content:'different'}]});
  assert.equal(retried,original);assert.equal(ids,1);
});
test('new accounts, profiles, conversations and questions do not share a request',()=>{
  let ids=0;const state=factory(storage(),()=>`request-${++ids}`);
  const first=state.begin('a:one:profile1',{message:'이직'});
  assert.notEqual(state.begin('b:one:profile1',{message:'이직'}),first);
  assert.notEqual(state.begin('a:two:profile1',{message:'이직'}),first);
  assert.notEqual(state.begin('a:one:profile2',{message:'이직'}),first);
  assert.notEqual(state.begin('a:one:profile1',{message:'재물'}),first);
});
test('after confirmed response the next intentional identical question gets a new ID',()=>{
  let ids=0;const state=factory(storage(),()=>`request-${++ids}`);
  const first=state.begin('a',{message:'이직'});state.clear();assert.notEqual(state.begin('a',{message:'이직'}),first);
});
test('disabled or corrupt session storage falls back to memory',()=>{
  for(const store of [undefined,{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}}]){
    let ids=0;const state=factory(store,()=>`request-${++ids}`);
    const first=state.begin('a',{message:'이직'});assert.equal(state.begin('a',{message:'이직'}),first);state.clear();
  }
});
