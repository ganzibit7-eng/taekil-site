'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('./account-session-core');
const html=fs.readFileSync('index.html','utf8');
const source=name=>{const found=html.match(new RegExp('(?:async )?function '+name+'\\([^]*?\\n}'));assert(found,name+' source');return found[0];};
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
function fixture(){let uid='A';const local=memory(),session=memory(),store=C.createStore(local,session,()=>uid);return {local,session,store,as:id=>uid=id};}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
test('account caches isolate A/B/guest and never adopt ownerless legacy records',()=>{
 const f=fixture();f.local.setItem('chat','legacy-private');f.store.setItem('chat','A-private');f.as('B');assert.equal(f.store.getItem('chat'),null);f.store.setItem('chat','B-private');f.as(null);assert.equal(f.store.getItem('chat'),null);f.store.setItem('chat','guest-private');assert.equal(f.local.getItem(C.key('chat',null)),null);f.as('A');assert.equal(f.store.getItem('chat'),'A-private');f.as('B');assert.equal(f.store.getItem('chat'),'B-private');assert.equal(f.local.getItem('chat'),'legacy-private');
});
test('same account logout/relogin and different account invalidate in-flight work',()=>{
 const f=fixture(),a=f.store.snapshot();f.as('B');assert.equal(f.store.current(a),false);f.as('A');f.store.invalidate();assert.equal(f.store.current(a),false);assert(f.store.current(f.store.snapshot()));
});
test('logout hides account caches immediately even before Firebase sign-out settles',()=>{
 const f=fixture();f.store.setItem('chat','A private');const pending=f.store.snapshot();f.store.beginSignOut();assert.equal(f.store.owner(),null);assert.equal(f.store.getItem('chat'),null);assert.equal(f.store.current(pending),false);f.as(null);assert.equal(f.store.owner(),null);f.as('A');assert.equal(f.store.getItem('chat'),'A private');
});
test('successful account deletion purges only that explicit owner namespace',()=>{
 const f=fixture();f.store.setItem('chat','A');f.as('B');f.store.setItem('chat','B');f.store.removeOwner(['chat'],'A');assert.equal(f.store.getItem('chat'),'B');f.as('A');assert.equal(f.store.getItem('chat'),null);
});
test('cloud conversation result for A cannot enter B cache',async()=>{
 const f=fixture(),pending=deferred();let saves=0;
 const ctx={accountStore:f.store,firebaseReady:true,firebase:{auth:()=>({currentUser:{uid:'A'}})},db:{collection:()=>({doc:()=>({collection:()=>({orderBy:()=>({limit:()=>({get:()=>pending.promise})})})})})},getAiConversationStore:()=>[],setAiConversationStore:()=>saves++,renderAiConversationHistory:()=>{},console};
 vm.createContext(ctx);vm.runInContext(source('syncAiConversationHistoryFromCloud'),ctx);const result=ctx.syncAiConversationHistoryFromCloud();f.as('B');pending.resolve({docs:[{id:'a',data:()=>({messages:['private A']})}]});await result;assert.equal(saves,0);
});
test('cloud saju result for A neither overwrites B nor uploads B profiles into A',async()=>{
 const f=fixture(),pending=deferred();let saves=0,batches=0;
 const ctx={accountStore:f.store,firebaseReady:true,firebase:{auth:()=>({currentUser:{uid:'A'}})},db:{batch:()=>{batches++;}},getSajuVaultCloudRef:()=>({limit:()=>({get:()=>pending.promise})}),getSajuVault:()=>[{id:'B-private'}],setSajuVault:()=>saves++,console};
 vm.createContext(ctx);vm.runInContext(source('syncSajuVaultFromCloud'),ctx);const result=ctx.syncSajuVaultFromCloud('A');f.as('B');pending.resolve({docs:[{id:'A-private',data:()=>({})}]});await result;assert.equal(saves,0);assert.equal(batches,0);
});
test('stale AI reply cannot render, save or reset the new conversation controls',async()=>{
 const f=fixture(),pending=deferred(),calls=[];
 const input={value:'fixture question'},button={disabled:false};
 const ctx={accountStore:f.store,window:{__aiConversationId:'a-chat',__aiChatHistory:[],__aiChatSubjects:[]},getKakaoUser:()=>null,firebaseReady:true,firebaseAuthReady:true,firebaseAuthUser:{uid:'A'},getCurrentUserKey:()=>f.store.owner(),document:{getElementById:id=>id==='aiChatInput'?input:id==='aiChatSendBtn'?button:null,querySelector:()=>null},clearAiFollowupSuggestions:()=>{},appendAiChatMessage:(role,content)=>{calls.push({role,content});return {classList:{add(){}},remove(){},innerHTML:''};},setActiveAiSession:()=>{},getAiRequestHeaders:async()=>({}),AI_CHAT_URL:'fixture://no-network',fetch:()=>pending.promise,console};
 vm.createContext(ctx);vm.runInContext(source('sendAiChatMessage'),ctx);const result=ctx.sendAiChatMessage();await Promise.resolve();await Promise.resolve();f.as('B');ctx.window.__aiConversationId='b-chat';ctx.window.__aiChatHistory=[];pending.resolve({ok:true,json:async()=>({reply:'private A answer'})});await result;assert.equal(calls.some(x=>x.content==='private A answer'),false);assert.equal(ctx.window.__aiChatHistory.length,0);assert.equal(button.disabled,true);
});
test('premium and credit responses for previous UID are ignored',async()=>{
 for(const name of ['checkPremiumOnServer','getQuestionCreditsFromServer']){
  const f=fixture(),pending=deferred();let applied=0;const ctx={accountStore:f.store,db:{collection:()=>({doc:()=>({get:()=>pending.promise})})},setLocalPremium:()=>applied++,console};vm.createContext(ctx);vm.runInContext(source(name),ctx);const result=ctx[name]('A');f.as('B');pending.resolve({exists:true,data:()=>({premium:true,premiumUntil:Date.now()+10000,aiQuestionCredits:10})});assert(!await result);assert.equal(applied,0);
 }
});
test('premium display requires the verified cache owner and preserves the cache during auth loading',()=>{
 const f=fixture();let cleared=0;const ctx={verifiedPremium:true,accountStore:f.store,getPremiumOwnerKey:()=>'A',getPremiumUntil:()=>Date.now()+10000,clearLocalPremium:()=>cleared++};vm.createContext(ctx);vm.runInContext(source('isPremium'),ctx);assert.equal(ctx.isPremium(),true);f.as(null);assert.equal(ctx.isPremium(),false);assert.equal(cleared,0);f.as('B');assert.equal(ctx.isPremium(),false);assert.equal(cleared,1);
});
test('local funnel drops existing/raw personal text and only retains event/time',()=>{
 const local=memory();local.setItem('funnel',JSON.stringify([{event:'old',at:1,question:'private'}]));let event;
 const ctx={localStorage:local,AI_FUNNEL_KEY:'funnel',DAILY_FUNNEL_EVENT_MAP:{},window:{dispatchEvent:e=>event=e},CustomEvent:class{constructor(type,opts){this.detail=opts.detail;}}};vm.createContext(ctx);vm.runInContext(source('trackAiFunnel'),ctx);ctx.trackAiFunnel('free_question_1',{question:'secret',pendingQuestion:'secret',birth:'private'});assert.deepEqual(Object.keys(event.detail).sort(),['at','event']);assert(!local.getItem('funnel').includes('private'));assert(!local.getItem('funnel').includes('secret'));
});
test('navigation pushes a new route and browser back does not create new history',()=>{
 const classes={remove(){},add(){},toggle(){}},node={classList:classes};let pushes=0;const location={href:'https://fixture.invalid/',pathname:'/',search:'',hash:''};
 const ctx={adminStatsUnsub:null,adminDailyVisitsUnsub:null,adminFunnelUnsub:null,adminDailyVisitsMidnightTimer:null,homeFreeScrollMode:false,document:{querySelectorAll:()=>[],getElementById:()=>node,querySelector:()=>null,documentElement:{classList:classes}},window:{scrollTo(){}},history:{replaceState(){},pushState(_a,_b,url){pushes++;location.hash=url.includes('#')?'#'+url.split('#')[1]:'';}},location,URL};vm.createContext(ctx);vm.runInContext(source('goTo'),ctx);ctx.goTo('plans');assert.equal(pushes,1);ctx.goTo('plans');assert.equal(pushes,1);location.hash='';ctx.goTo('home',undefined,{skipHistory:true});assert.equal(pushes,1);
});
test('integration loads owner store before legacy scripts and removes only hidden animation loops',()=>{
 assert(html.indexOf('src="account-session-core.js')<html.indexOf('const BIRTH_LOCK_KEY'));
 assert(!html.includes('requestAnimationFrame(draw)'));assert(!html.includes('requestAnimationFrame(move)'));
 const rules=fs.readFileSync('firebase/firestore.rules','utf8').split('match /inquiries/')[1].split('match /debugLogs/')[0];assert(rules.includes('allow list: if isAdmin()\n        || (signedIn() && resource.data.ownerUid == request.auth.uid)'));
 const adapter=fs.readFileSync('account-session.js','utf8');assert(adapter.includes("where('ownerUid','==',token.owner)"));assert(adapter.includes('!store.current(token)||request!==inquiryRequest'));assert(adapter.includes("e.key==='Escape'"));assert(adapter.includes("e.key!=='Tab'"));
});
test('each approved legacy change has exactly its recorded scope',()=>{
 let text=html;for(const c of JSON.parse(fs.readFileSync('account-ui-contract-changes.json','utf8')).reverse()){
  assert.equal(text.split(c.after).length-1,c.count,c.after.slice(0,80));text=text.split(c.after).join(c.before);
 }
});
function adapterFixture(){
 const f=fixture(),pending=deferred(),nodes=new Map(),docEvents={},winEvents={},seen=[];let query;
 const classes={contains:()=>false,remove(){},add(){}};
 const ctx={accountStore:f.store,document:{getElementById:id=>nodes.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],body:{classList:classes},addEventListener:(key,fn)=>docEvents[key]=fn},updateAuthNav(){},logout(){},renderSupportList(){seen.push(JSON.parse(f.store.getItem('taekilso_my_inquiries')||'[]'));},showSupportStatus(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},db:{collection:name=>({where:(field,op,owner)=>{query={name,field,op,owner};return {limit:()=>({get:()=>pending.promise})};}})},console,requestAnimationFrame:fn=>fn()};
 ctx.window=ctx;ctx.addEventListener=(key,fn)=>winEvents[key]=fn;ctx.dispatchEvent=e=>winEvents[e.type]?.(e);
 const load=()=>{vm.createContext(ctx);vm.runInContext(fs.readFileSync('account-session.js','utf8'),ctx);};
 return {...f,ctx,nodes,docEvents,winEvents,seen,pending,query:()=>query,load};
}
test('a new device retrieves only own inquiry references, and ignores forged different-owner rows',async()=>{
 const f=adapterFixture();f.load();f.ctx.renderSupportList();assert.deepEqual(f.query(),{name:'inquiries',field:'ownerUid',op:'==',owner:'A'});f.pending.resolve({size:2,docs:[{id:'mine',data:()=>({ownerUid:'A',title:'mine',createdAtMs:1})},{id:'other',data:()=>({ownerUid:'B',title:'private',createdAtMs:2})}]});await Promise.resolve();assert.deepEqual(JSON.parse(f.store.getItem('taekilso_my_inquiries')).map(x=>x.id),['mine']);
});
test('inquiry lookup and private memory are discarded on account switch',async()=>{
 const f=adapterFixture();f.load();f.ctx.__aiChatHistory=[{content:'A private'}];f.ctx.renderSupportList();f.as('B');f.ctx.updateAuthNav();f.pending.resolve({size:1,docs:[{id:'mine',data:()=>({ownerUid:'A',title:'private'})}]});await Promise.resolve();assert.equal(f.store.getItem('taekilso_my_inquiries'),null);assert.equal(f.ctx.__aiChatHistory.length,0);
});
test('login modal traps keyboard focus, closes with Escape and restores its trigger',()=>{
 const f=adapterFixture(),doc=f.ctx.document;
 const button=()=>({disabled:false,isConnected:true,getClientRects:()=>[{}],focus(){doc.activeElement=this;}}),trigger=button(),first=button(),last=button();
 const overlay={style:{display:'none'},setAttribute(){},getClientRects:()=>[{}],querySelector:q=>q==='.auth-close'?null:first,querySelectorAll:()=>[first,last],contains:el=>el===first||el===last};
 f.nodes.set('authOverlay',overlay);doc.activeElement=trigger;f.ctx.openAuthModal=()=>overlay.style.display='flex';f.ctx.closeAuthModal=()=>overlay.style.display='none';f.load();f.ctx.openAuthModal();assert.equal(doc.activeElement,first);last.focus();let prevented=false;f.docEvents.keydown({key:'Tab',preventDefault(){prevented=true;}});assert(prevented);assert.equal(doc.activeElement,first);f.docEvents.keydown({key:'Escape',preventDefault(){}});assert.equal(overlay.style.display,'none');assert.equal(doc.activeElement,trigger);
});
test('owned report handoffs cannot reappear after logout; an intentional guest handoff survives sign-in',()=>{
 const H=require('./free-report-handoff-core'),p={id:'flow',createdAt:Date.now(),profile:{y:1990,m:1,d:1,calType:'solar',isLeap:false},question:'fixture',stage:'awaiting-auth',owner:'A'};assert.equal(H.pending(p,Date.now(),null),null);assert(H.pending({...p,owner:null},Date.now(),'B'));
});
test('newyear payment-return response is rejected after switching accounts',async()=>{
 const f=fixture(),pending=deferred(),text=fs.readFileSync('newyear-consultation.js','utf8'),request=text.match(/async function request\(operation,profile\)\{[\s\S]*?\n  }/)[0];
 const ctx={window:{accountStore:f.store},owner:()=>f.store.owner(),getAiRequestHeaders:async()=>({}),fetch:()=>pending.promise,AI_CHAT_URL:'fixture://no-network',AbortSignal:{timeout:()=>null}};vm.createContext(ctx);vm.runInContext(request,ctx);const result=ctx.request('status');await Promise.resolve();f.as('B');pending.resolve({ok:true,json:async()=>({profile:{name:'A private'},status:'ready'})});await assert.rejects(result,/계정이 변경/);
});
