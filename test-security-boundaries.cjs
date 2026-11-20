const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
const source=name=>{const s=html.match(new RegExp('(?:async )?function '+name+'\\([^]*?\\n}'));assert(s,name);return s[0]};
function oauth(){const rows=new Map();let now=1000,calls=0;const context={window:{crypto:crypto.webcrypto,location:{href:'https://taekilso.com/?code=dummy&state=bad'},history:{replaceState(){}}},document:{title:'test'},URL,URLSearchParams,Uint8Array,Date:{now:()=>now},sessionStorage:{setItem:(k,v)=>rows.set(k,v),getItem:k=>rows.get(k),removeItem:k=>rows.delete(k)},showToast(){},fetch:async()=>{calls++;throw Error('unexpected network')},console:{error(){}}};vm.createContext(context);vm.runInContext(['createKakaoLoginState','consumeKakaoLoginState','exchangeKakaoCode'].map(source).join('\n'),context);return {context,rows,setTime:t=>now=t,calls:()=>calls};}
test('Kakao state is unpredictable, expires, is tab-bound and consumed once',()=>{
 const f=oauth(),state=f.context.createKakaoLoginState();assert.match(state,/^[a-f0-9]{64}$/);assert.notEqual(state,f.context.createKakaoLoginState());
 const current=f.context.createKakaoLoginState();assert.equal(oauth().context.consumeKakaoLoginState(current),false);assert.equal(f.context.consumeKakaoLoginState(current),true);assert.equal(f.context.consumeKakaoLoginState(current),false);
 const expired=f.context.createKakaoLoginState();f.setTime(602000);assert.equal(f.context.consumeKakaoLoginState(expired),false);
});
test('unsolicited, mismatched and reused Kakao callbacks never exchange a token',async()=>{
 const f=oauth();await f.context.exchangeKakaoCode('dummy','bad');const state=f.context.createKakaoLoginState();await f.context.exchangeKakaoCode('dummy','0'.repeat(64));await f.context.exchangeKakaoCode('dummy',state);assert.equal(f.calls(),0);
});
test('matched Kakao callback exchanges once and forwards its state',async()=>{
 const f=oauth();let body;f.context.KAKAO_REST_KEY='public-test';f.context.KAKAO_REDIRECT_URI='https://taekilso.com/';f.context.fetch=async(url,opts)=>{body=new URLSearchParams(opts.body);return {status:400,json:async()=>({error:'dummy-stop'})}};
 const state=f.context.createKakaoLoginState();await f.context.exchangeKakaoCode('dummy',state);assert.equal(body.get('state'),state);assert.equal(body.get('code'),'dummy');assert.equal(f.context.consumeKakaoLoginState(state),false);
});
test('inquiry queues route replies to the snapshot ID and reject stale sessions',async()=>{
 const id='x"><tag>', writes=[], notices=[];
 class Node {
   constructor(){this.children=[];this.dataset={};this.refs={};}
   set innerHTML(value){this.markup=value;}
   querySelector(s){return this.refs[s]??=Object.assign(new Node(),{parentNode:this});}
   querySelectorAll(){return [];}
   replaceChildren(){this.children=[];}
   append(...items){for(const item of items){this.children.push(item);item.parentNode=this;}}
   setAttribute(key,value){this[key]=value;}
   focus(){}
 }
 const wrap=new Node(),pendingCount=new Node();let active=true;
 const data={status:'대기',title:'<strong>테스트</strong>',message:'본문',reply:''};
 const ref={id};const doc=()=>({exists:true,id,ref,data:()=>({...data})});
 const queries=[];
 const db={collection:()=>({where:(field,op,status)=>({get:async()=>{
   queries.push(status);return {docs:data.status===status?[doc()]:[]};
 }})}),runTransaction:fn=>fn({get:async()=>doc(),update:(target,patch)=>{writes.push(target.id);Object.assign(data,patch);}})};
 const ctx={document:{createElement:()=>new Node()},db,wrap,pendingCount,current:()=>active,toast:v=>notices.push(v)};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('inquiry-queue.js','utf8'),ctx);
 ctx.mountInquiryQueue(ctx);
 await new Promise(setImmediate);
 const rows=wrap.querySelector('.inquiry-rows'),group=wrap.querySelector('.inquiry-switch');
 assert.equal(pendingCount.textContent,'1');assert.deepEqual(queries,['대기']);
 const card=rows.children[0];assert.equal(card.children[1].textContent,data.title);assert(!card.markup);
 const [editor,save]=card.children.at(-1).children;
 editor.value='  ';await save.onclick();assert.equal(writes.length,0);
 editor.value='테스트 답변';await Promise.all([save.onclick(),save.onclick()]);
 assert.deepEqual(writes,[id]);assert.equal(pendingCount.textContent,'0');
 assert.equal(rows.children.length,0);
 group.children[1].onclick();await new Promise(setImmediate);
 assert.equal(rows.children[0].children[3].textContent,'테스트 답변');
 const edit=rows.children[0].children.at(-1).children;
 data.reply='다른 창의 답변';edit[1].value='수정';await edit[2].onclick();
 assert.equal(writes.length,1);assert.match(notices.at(-1),/변경/);
 active=false;await edit[2].onclick();assert.equal(writes.length,1);
});
