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
test('malicious inquiry IDs remain inert data and reply saves the exact document',async()=>{
 const id='x"><img src=x onerror=alert(1)>',cards=[],updates=[];const textarea={dataset:{},value:'답변'},button={dataset:{},addEventListener(event,fn){this.click=fn}};
 const doc={id,data:()=>({title:'문의',message:'본문',status:'대기',reply:''})};let active=true;
 const wrap={innerHTML:'',appendChild:c=>cards.push(c)};
 const context={accountStore:{snapshot:()=>1,current:()=>active},isAdmin:()=>true,document:{getElementById:id=>id==='adminInquiryList'?wrap:null,createElement:()=>({innerHTML:'',querySelector:s=>s==='textarea'?textarea:button})},db:{collection:()=>({limit:()=>({get:async()=>({empty:false,forEach:fn=>fn(doc)})}),doc:value=>({update:async patch=>updates.push({value,patch})})})},escapeHtml:v=>String(v).replaceAll('<','&lt;').replaceAll('>','&gt;'),showToast(){},console};
 vm.createContext(context);vm.runInContext(source('renderAdminInquiries'),context);context.renderAdminInquiries();await new Promise(setImmediate);
 assert.equal(cards.length,1);assert(!cards[0].innerHTML.includes(id));assert(!cards[0].innerHTML.includes('onerror'));assert.equal(button.dataset.replyId,id);
 button.click();active=false;await new Promise(setImmediate);assert.equal(updates[0].value,id);assert.equal(updates[0].patch.reply,'답변');button.click();assert.equal(updates.length,1);
});
