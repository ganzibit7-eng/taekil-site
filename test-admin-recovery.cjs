const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const source=name=>html.match(new RegExp('function '+name+'\\([^]*?\\n}'))[0];
function fixture(){
  const elements=new Map(),listeners=new Map(),timers=new Map(); let sequence=0,valid=true,resolveInquiry;
  function element(){return {textContent:'',innerHTML:'',style:{},dataset:{},children:[],setAttribute(k,v){this[k]=v},replaceChildren(...v){this.children=v;this.textContent=v.filter(x=>typeof x==='string').join('')},appendChild(v){this.children.push(v)},querySelectorAll(){return []},addEventListener(){}}}
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
  const inquiry=new Promise(resolve=>resolveInquiry=resolve);
  const ctx={console:{warn(){},error(){}},document:{getElementById:get,createElement:element,createTextNode:v=>v},window:{addEventListener(){},removeEventListener(){},dispatchEvent(){}},accountStore:{snapshot:()=>({owner:'admin',generation:0}),current:()=>valid},isAdmin:()=>valid,
    setTimeout:(fn,ms)=>{const id=++sequence;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),
    db:{collection(name){const query={doc:()=>query,where:()=>query,limit:()=>query,get:()=>inquiry,onSnapshot(next,error){listeners.set(name,{next,error});return ()=>listeners.delete(name)}};return query}},
    adminStatsUnsub:null,adminUsersUnsub:null,adminDailyVisitsUnsub:null,adminDailyVisitsMidnightTimer:null,adminFunnelUnsub:null,adminMemberSortMode:'recent_signup',
    getKstDateKey:()=> '2026-11-13',msUntilNextKstMidnight:()=>3600000,loadAdminBanList(){},renderAdminInquiries(){},
    adminTimestampMs:(v,f=0)=>Number(v)||f,adminRelativeTime:()=> '방금',adminFormatDateTime:()=> '2026-11-13',escapeHtml:String,sortAdminUserListDom(){},filterAdminUserList(){},buildAdminRecentInquiryMap:()=>new Map(),CustomEvent:class{}};
  vm.createContext(ctx);vm.runInContext(source('renderAdmin'),ctx);
  return {ctx,get,listeners,timers,resolveInquiry,invalidate:()=>valid=false};
}
const members={empty:false,forEach:fn=>fn({id:'test-member',data:()=>({nickname:'검증 회원',createdAtMs:100,aiQuestionCredits:3})})};
test('member rows and totals render before optional inquiries resolve',async()=>{
 const f=fixture();f.ctx.renderAdmin();f.listeners.get('users').next(members);
 assert.equal(f.get('statSignups').textContent,1);assert.equal(f.get('adminUserList').children.length,1);
 assert.equal(f.get('adminUserList')['aria-busy'],'false');assert.match(f.get('adminMembersStatus').textContent,/실시간/);
 f.resolveInquiry({});await new Promise(setImmediate);assert.equal(f.get('statSignups').textContent,1);
});
test('slow loads show recovery controls; late success replaces pending notice',()=>{
 const f=fixture();f.ctx.renderAdmin();[...f.timers.values()].find(t=>t.ms===15000).fn();
 assert.match(f.get('adminMembersStatus').textContent,/지연/);assert.equal(f.get('adminMembersStatus').children[1].textContent,'다시 불러오기');
 f.listeners.get('users').next({empty:true});assert.match(f.get('adminMembersStatus').textContent,/등록된 회원이 없습니다/);assert.equal(f.get('statActivePremium').textContent,'0');
 f.listeners.get('stats').next({exists:true,data:()=>({visits:8})});assert.equal(f.get('statVisits').textContent,8);assert.match(f.get('adminStatsStatus').textContent,/실시간/);
});
test('failed loads show retry, and old callbacks cannot render after cleanup',async()=>{
 const f=fixture();f.ctx.renderAdmin();const users=f.listeners.get('users'),stats=f.listeners.get('stats');
 users.error(Error('offline'));stats.error(Error('offline'));assert.match(f.get('adminStatsStatus').textContent,/불러오지 못/);
 f.ctx.window.__cleanupLegacyAdminViews();f.invalidate();const before=f.get('adminUserList').innerHTML;
 users.next(members);stats.next({exists:true,data:()=>({visits:99})});f.resolveInquiry({});await new Promise(setImmediate);
 assert.equal(f.get('adminUserList').innerHTML,before);assert.notEqual(f.get('statVisits').textContent,99);
 assert(!f.listeners.has('users'));assert(!f.listeners.has('stats'));
});
test('initial stats and members are expanded, explicit fold choice persists',()=>{
 const rows=new Map(),folds=['adminFoldStats','adminFoldMembers','adminFoldFunnel'].map(id=>({id,open:false,classList:{},querySelector(){return {setAttribute:(k,v)=>this.aria=v}}}));
 for(const f of folds){f.classList.toggle=(name,v)=>f.open=v;f.classList.contains=()=>f.open;}
 const ctx={document:{querySelectorAll:()=>folds,getElementById:id=>folds.find(f=>f.id===id)},sessionStorage:{getItem:k=>rows.get(k)??null,setItem:(k,v)=>rows.set(k,v)}};
 vm.createContext(ctx);vm.runInContext(source('restoreAdminFolds')+'\n'+source('toggleAdminFold'),ctx);
 ctx.restoreAdminFolds();assert.deepEqual(folds.map(f=>f.open),[true,true,false]);
 ctx.toggleAdminFold('adminFoldMembers');ctx.restoreAdminFolds();assert.deepEqual(folds.map(f=>f.open),[true,false,false]);assert.equal(folds[1].aria,'false');
});
test('visible admin reconnects after account cleanup even when its container is still visible',()=>{
 const js=fs.readFileSync('admin-analytics.js','utf8');
 const sync=js.match(/  function sync\(\)\{[^]*?\n  }/)[0];let calls=0,tokenCurrent=false;
 const root={hidden:false},content={style:{display:'block'}},view={classList:{contains:()=>true}};
 const ctx={root,active:true,busy:false,request:0,data:null,allowed:()=>true,load(){},renderAdmin(){calls++;tokenCurrent=true},window:{accountStore:{current:()=>tokenCurrent}},document:{getElementById:id=>id==='view-admin'?view:content,body:{classList:{toggle(){}}},documentElement:{classList:{toggle(){}}}}};
 vm.createContext(ctx);vm.runInContext(sync,ctx);ctx.sync();ctx.sync();assert.equal(calls,1);assert.equal(root.hidden,false);
});
