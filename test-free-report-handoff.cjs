'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('./free-report-handoff-core');
const birth={y:1990,m:1,d:1,calType:'solar',isLeap:false};
test('handoff preserves entered calendar and date without inventing hour or gender',()=>{
 assert.deepEqual(C.profile({...birth,name:'sensitive',hourValue:'17',gender:'male',secret:'ignore'}),{name:'나',relation:'본인',...birth,hourValue:'unknown',gender:'unknown'});
 assert.equal(C.profile({...birth,m:2,d:31}),null);assert.equal(C.profile({...birth,y:9999}),null);
 assert.equal(C.profile({...birth,calType:'lunar',isLeap:true}).isLeap,true);
});
test('pending handoffs expire, reject account changes and never accept URL-style incomplete data',()=>{
 const now=Date.now(),p={id:'result-flow',createdAt:now,profile:birth,question:'선택한 질문',stage:'awaiting-auth',owner:'one'};
 assert(C.pending(p,now,'one'));assert.equal(C.pending(p,now,'two'),null);assert.equal(C.pending(p,now+C.TTL+1,'one'),null);
 assert.equal(C.pending({...p,createdAt:now+120000},now,'one'),null);assert.equal(C.pending({...p,question:'x'.repeat(501)},now,'one'),null);assert.equal(C.pending({question:'x'},now,'one'),null);
 assert(C.pending({...p,owner:null},now,'new-member'));
});
test('question suggestions reuse an existing strength and have safe generic fallbacks',()=>{
 const q=C.questions({strength:'성장·기획·관계 확장',element:'목'});assert.equal(q.length,3);assert(q[0].text.includes('성장'));
 assert(!C.questions({})[0].text.includes('undefined'));assert(!q.some(x=>/2027|대운|월별|신년/.test(x.text)));
});
test('existing-member sign-in and profile repair are not counted as new registrations from a report',()=>{
 const now=Date.now(),p={createdAt:now,stage:'awaiting-auth',startedLoggedOut:true};
 assert(C.signupFromReport(p,{metadata:{creationTime:new Date(now+100).toISOString()}},now+200));
 assert(!C.signupFromReport(p,{metadata:{creationTime:'2020-01-01T00:00:00Z'}},now+200));
 assert(!C.signupFromReport({...p,startedLoggedOut:false},{metadata:{creationTime:new Date(now).toISOString()}},now));
 assert(!C.signupFromReport(p,{metadata:{}},now));
});
test('CTA availability follows premium expiry, remaining lifetime free uses and bought credits',()=>{
 assert.equal(C.availability(null).kind,'unknown');assert(C.availability({aiFreeUsed:1}).note.includes('2개'));
 assert.equal(C.availability({aiFreeUsed:3,aiQuestionCredits:5}).kind,'credits');
 assert.equal(C.availability({aiFreeUsed:3,premium:true,premiumUntil:1}).kind,'exhausted');
 assert.equal(C.availability({aiFreeUsed:3,premium:true,premiumUntil:Date.now()+10000}).kind,'premium');
});
test('actual existing chat startup opens the selected profile without sending old paid/category/today questions in report mode',()=>{
 const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('function startAiChat('),source=html.slice(start,html.indexOf('/* 빠른 질문 버튼',start));
 const values={aiChatYear:1990,aiChatMonth:1,aiChatDay:1,aiChatCalType:'solar',aiChatHour:'unknown',aiChatGender:'unknown',aiChatProfileName:'나',aiChatRelation:'본인'};
 const nodes=new Map(Object.entries(values).map(([id,value])=>[id,{value,style:{},checked:false}]));
 for(const id of ['aiChatSetup','aiChatPanel','aiChatWindow','aiChatLeap','aiChatCompareProfile','aiChatCompareProfile2'])nodes.set(id,{value:'',checked:false,style:{},innerHTML:''});
 let sent=0,paidReads=0,todayReads=0,saved;
 const context={window:{__pendingCategoryQuestion:'기존 자동 질문'},document:{getElementById:id=>nodes.get(id)||null},showToast(){},resolveBirthDate:()=>new Date('1990-01-01T00:00:00+09:00'),buildAiChatSajuSummary:()=>({text:'기존 계산 요약',data:{}}),saveSajuProfileRecord:p=>(saved={...p,id:'profile'}),getSajuVault:()=>[],makeAiConversationId:()=>'session',setActiveAiSession(){},clearAiFollowupSuggestions(){},appendAiChatMessage(){},updateAiChatStatus(){},isPremium:()=>false,getPendingPaidAiQuestion(){paidReads++;return '과거 결제 질문';},takeTodayFortunePendingQuestion(){todayReads++;return '오늘 질문';},resumePendingPaidAiQuestion(){sent++;},quickAskAiChat(){sent++;},setTimeout:fn=>fn(),fetch(){sent++;}};
 vm.createContext(context);vm.runInContext(source,context);context.startAiChat({source:'free-report'});
 assert.equal(sent,0);assert.equal(paidReads,0);assert.equal(todayReads,0);assert.equal(saved.y,1990);assert.equal(saved.hourValue,'unknown');assert.equal(nodes.get('aiChatPanel').style.display,'flex');
 context.startAiChat();assert(sent>0,'Original automatic behavior outside this report route is preserved');
});
test('controller has no AI request and analytics transmits only a fixed source',()=>{
 const source=fs.readFileSync('free-report-handoff.js','utf8');assert(!/\bfetch\s*\(|quickAskAiChat\s*\(|sendAiChatMessage\s*\(/.test(source));
 assert(source.includes("trackAiFunnel(name,{source:'free_report'})"));assert(source.includes('sessionStorage.setItem(KEY'));
 assert(!source.includes('localStorage.setItem(KEY'));assert(!source.includes('history.replaceState'));assert.equal(Object.keys(C.events).length,7);
});
test('Firestore review rules change only the seven report counters in the existing dailyFunnel whitelist',()=>{
 const rules=fs.readFileSync('firebase/firestore.rules','utf8').replace(/\r\n/g,'\n'),start=rules.indexOf('    match /dailyFunnel/'),end=rules.indexOf('    match /dailyTrafficSources/',start);
 let block=rules.slice(start,end);
 for(const field of Object.values(C.events)){
  assert.equal((block.match(new RegExp("'"+field+"'",'g'))||[]).length,2);
  block=block.replace(new RegExp(",\\s*'"+field+"'",'g'),'');
 }
 const restored=rules.slice(0,start)+block+rules.slice(end);
 assert.equal(require('node:crypto').createHash('sha256').update(restored).digest('hex'),'8e921d4f75aa0f78bde7f452a8c8a90d34b90fe5239d97bf259453f90904f848');
});
test('profile X delegates only the selected profile and preserves selection when deletion is cancelled',async()=>{
 const element=()=>({hidden:false,disabled:false,value:'',attrs:{},listeners:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;}});
 const select=element(),button=element(),meta=element();let cancel=true,calls=[];
 let profiles=[{id:'one',name:'나',y:1990,m:1,d:1,calType:'solar'},{id:'two',name:'가족',y:1995,m:2,d:3,calType:'solar'}];
 const nodes={aiChatSavedProfile:select,aiChatDeleteProfile:button,aiChatSelectedProfileMeta:meta};
 const context={document:{getElementById:id=>nodes[id]||null},MutationObserver:class{observe(){}},getSajuVault:()=>profiles,deleteSajuProfile:id=>{calls.push(id);if(!cancel)profiles=profiles.filter(p=>p.id!==id);}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('profile-picker-controls.js','utf8'),context);
 assert.equal(button.hidden,true);select.value='one';select.listeners.change();assert.equal(button.hidden,false);assert(button.attrs['aria-label'].includes('1990.01.01'));
 await button.listeners.click();assert.equal(profiles.length,2);assert.equal(select.value,'one');assert.equal(button.disabled,false);
 cancel=false;await button.listeners.click();assert.deepEqual(profiles.map(p=>p.id),['two']);assert.equal(select.value,'');assert.equal(button.hidden,true);assert.equal(meta.hidden,true);
 await button.listeners.click();assert.deepEqual(calls,['one','one']);
});
