'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');

const source = readFileSync('src/home/checkout.js', 'utf8');
const paymentReturn = source.slice(source.indexOf('function readPendingPayment()'), source.indexOf('async function checkPremiumOnServer'));
const creditStatus = source.slice(source.indexOf('async function getQuestionCreditsFromServer'), source.indexOf('async function payPremium()'));

function fixture(options = {}) {
  const pending = { orderId:'fixture-order', product:'ai_question_pack_5', paymentUid:'owner', createdAt:Date.now() };
  let stored = JSON.stringify(pending), owner = options.owner ?? null;
  let order = { uid:'owner', product:pending.product, status:'paid', entitlementGranted:true, ...options.order };
  let balance = options.credits ?? 5;
  const calls = [], notices = [], timers = [], authEvents = {}, documentEvents = {}, events = [];
  const nodes = { aiChatPanel:{ style:{display:'flex'} }, aiChatStatus:{textContent:''}, aiChatSendBtn:{disabled:false} };
  const window = {
    __aiConversationId:'fixture-chat', location:{href:'https://example.test/?premium=1#home'},
    history:{state:{example:true}, replaceState(state, _unused, url){this.state=state; window.location.href=url.href;}},
    addEventListener(name, handler){authEvents[name] = handler;}, dispatchEvent(event){events.push(event);}
  };
  const context = vm.createContext({
    window, URL, console, document:{ addEventListener(name, handler){documentEvents[name] = handler;},getElementById:id=>nodes[id] },
    localStorage:{ getItem:()=>stored, removeItem:()=>{stored=null;} }, sessionStorage:{removeItem(){}},
    accountStore:{ snapshot:()=>({owner}), owner:()=>owner, current:token=>token.owner===owner },
    db:{ collection:name=>({doc:id=>({async get(){
      calls.push([name,id]);
      if (name==='users' && balance===null) throw new Error('Temporary network error');
      return {exists:true, data:()=>name==='users'?{aiQuestionCredits:balance}:order};
    }})})},
    AI_QUESTION_PACKS:{ai_question_pack_5:{count:5}}, showToast:message=>notices.push(message),
    trackSeoConversion(){}, trackAiFunnel(){}, restoreKakaoUserState(){}, updateAuthNav(){},
    waitForAuthSettled:async()=>{}, CustomEvent:class {constructor(type, init){Object.assign(this,{type,...init});}},
    getPendingPaidAiQuestion:()=>options.pendingQuestion ? 'fixture' : '',
    restoreActiveAiConversation:()=>{calls.push('restore');return true;},
    resumePendingPaidAiQuestion:()=>calls.push('resume'), restoreAlgorithmicFollowupsAfterPurchase:()=>calls.push('followups'),
    setTimeout:(callback, ms)=>timers.push([callback,ms]), isPremium:()=>false, isAdmin:()=>false,
    updateAiChatStatus:(_used,_limit,_isPremium,result)=>{nodes.aiChatStatus.textContent=`질문권 ${result.questionCreditsLeft}개 남음`;}
  });
  vm.runInContext(creditStatus+paymentReturn, context);
  return { context, window, notices, calls, timers, events, nodes, documentEvents, authEvents,
    setOwner(next){owner=next;}, setCredits(next){balance=next;}, setStatus(next){order={...order,status:next};}, stored:()=>stored };
}

test('return waits for the owning account and confirms from its real balance after delayed login', async () => {
  const f = fixture({pendingQuestion:true,credits:4});
  f.documentEvents.DOMContentLoaded();
  await new Promise(setImmediate);
  assert.equal(f.window.location.href,'https://example.test/#home');
  assert.deepEqual(f.calls,[]);
  f.setOwner('different-account');
  await f.authEvents['taekilso:authChanged']();
  assert.deepEqual(f.calls,[]);
  f.setOwner('owner');
  await f.authEvents['taekilso:authChanged']();
  assert.deepEqual(f.calls,[['paymentOrders','fixture-order'],['users','owner'],'restore']);
  assert.match(f.notices.at(-1), /현재 4개 남아/);
  assert.equal(f.events[0].detail.credits,4);
  assert.equal(f.stored(),null);
  f.timers.find(([,ms])=>ms===700)[0]();
  assert.equal(f.calls.at(-1),'resume');
});

test('refunded and review-required orders cannot resume or show a successful grant', async () => {
  for (const [order,message,clear] of [[{status:'refunded'},/취소 또는 환불/,true],
    [{entitlementGranted:false},/지급은 확인이 필요/,false]]) {
    const f=fixture({owner:'owner',order,pendingQuestion:true});
    await f.context.confirmReturnedPayment();
    assert.match(f.notices.at(-1),message);
    assert.deepEqual(f.calls,[['paymentOrders','fixture-order']]);
    assert.deepEqual(f.events,[]);
    assert.equal(f.stored()===null,clear);
  }
});

test('confirmation retries pending state, deduplicates overlapping checks, and does not resume with zero balance', async () => {
  const f=fixture({owner:'owner',order:{status:'pending'},credits:0,pendingQuestion:true});
  const waiting=f.context.confirmReturnedPayment();
  await f.context.confirmReturnedPayment();
  assert.deepEqual(f.calls,[['paymentOrders','fixture-order']]);
  await new Promise(setImmediate);
  f.setStatus('paid');
  f.timers.shift()[0]();
  await waiting;
  assert.match(f.notices.at(-1),/현재 0개 남아/);
  f.timers.find(([,ms])=>ms===700)[0]();
  assert(!f.calls.includes('resume'));
});

test('a restored chat shows its current server balance without overwriting a newer response', async () => {
  const f=fixture({owner:'owner'});
  await f.context.refreshQuestionCreditUI('owner');
  assert.equal(f.nodes.aiChatStatus.textContent,'질문권 5개 남음');
  f.setCredits(4);
  const pending=f.context.refreshQuestionCreditUI('owner');
  f.nodes.aiChatStatus.textContent='질문권 3개 남음';
  await pending;
  assert.equal(f.nodes.aiChatStatus.textContent,'질문권 3개 남음');
});
