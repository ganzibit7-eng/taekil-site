const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('index.html','utf8').match(/async function requestRefund\(\) \{[^]*?\n\}/)[0];
test('failed usage lookup prepares a reviewable refund draft without sending an inquiry',async()=>{
 const nodes={supportTitle:{value:''},supportMessage:{value:'',focus(){}}};let route,event;
 const context={window:{},accountStore:{snapshot:()=>1,current:()=>true,getItem:()=>null},getKakaoUser:()=>({}),isPremium:()=>true,getPremiumUntil:()=>0,getCurrentUserKey:()=> 'test-owner',db:{collection:()=>({doc:()=>({get:async()=>{throw Error('offline');}})})},console:{error(){}},goTo:value=>route=value,CustomEvent:class{constructor(type){this.type=type;}},document:{dispatchEvent:e=>event=e.type,getElementById:id=>nodes[id]},setTimeout:fn=>fn(),showToast(){},submitInquiry(){throw Error('Draft was sent automatically');}};
 vm.createContext(context);await vm.runInContext(`(${source})()`,context);
 assert.equal(route,'support');assert.equal(event,'taekilso:openWebInquiry');
 assert.match(nodes.supportMessage.value,/이용 횟수: 확인 필요/);
 assert.match(nodes.supportMessage.value,/환불 사유/);
 assert.doesNotMatch(nodes.supportMessage.value,/조작 불가|환불이 가능/);
});
