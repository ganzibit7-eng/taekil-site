const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/home/member-support.js', 'utf8');
const helpers = source.slice(source.indexOf('function fillCommonInquiry('), source.indexOf('async function confirmDeleteAccount('));

function setup({ premium = false, signedIn = true, lookup } = {}) {
  const nodes = {supportType:{value:''}, supportTitle:{value:''}, supportMessage:{value:'',focus(){}}};
  const calls = [];
  const context = {
    accountStore:{snapshot:()=>1,current:()=>true,getItem:()=>null},
    getKakaoUser:()=>signedIn ? {} : null, firebaseReady:false, isPremium:()=>premium,
    getPremiumUntil:()=>0, getCurrentUserKey:()=> 'test-owner',
    db:{collection:()=>({doc:()=>({get:() => { calls.push('lookup'); return lookup(); }})})},
    console:{error(){}}, goTo:value=>calls.push(value),
    CustomEvent:class{constructor(type){this.type=type;}},
    document:{dispatchEvent:e=>calls.push(e.type), getElementById:id=>nodes[id]},
    showToast(){}, openAuthModal:()=>calls.push('login')
  };
  vm.runInNewContext(helpers, context);
  return {context,nodes,calls};
}

test('report and question-pack purchasers can prepare a refund inquiry without a legacy pass or an automatic submission', async () => {
  const {context,nodes,calls} = setup();
  await context.requestRefund();
  assert.deepEqual(calls,['support','taekilso:openWebInquiry']);
  assert.equal(nodes.supportType.value,'dispute');
  assert.match(nodes.supportTitle.value,/환불/);
  assert.match(nodes.supportMessage.value,/상품명:[\s\S]+환불 사유/);
  assert.doesNotMatch(nodes.supportMessage.value,/프리미엄|8,900/);
  context.fillCommonInquiry('premiumNotOpen');
  assert.match(nodes.supportMessage.value,/리포트 열람, 질문권 잔여 횟수/);
  assert.doesNotMatch(nodes.supportTitle.value,/프리미엄/);
});

test('a legacy pass adds optional usage context even if its lookup fails', async () => {
  const {context,nodes} = setup({premium:true,lookup:async()=>{throw Error('offline');}});
  await context.requestRefund();
  assert.equal(nodes.supportType.value,'dispute');
  assert.match(nodes.supportMessage.value,/이용 횟수: 확인 필요/);
  assert.match(nodes.supportMessage.value,/환불 사유/);
  assert.doesNotMatch(nodes.supportMessage.value,/조작 불가|환불이 가능/);
});

test('delayed legacy metadata preserves a member’s edits and guests reach sign-in', async () => {
  let done;
  const {context,nodes} = setup({premium:true,lookup:()=>new Promise(resolve=>{done=resolve;})});
  const draft = context.requestRefund();
  nodes.supportMessage.value = '도겸 리포트 결제를 문의할게요.';
  done({exists:true,data:()=>({premiumUsageCount:2})});
  await draft;
  assert.equal(nodes.supportMessage.value,'도겸 리포트 결제를 문의할게요.');
  const guest = setup({signedIn:false});
  await guest.context.requestRefund();
  assert.deepEqual(guest.calls,['login']);
  assert.equal(guest.nodes.supportMessage.value,'');
});
