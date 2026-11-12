const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('./consultation-experience-core'),accounts=require('./account-session-core');
test('followups match the current concern, deduplicate asked questions and avoid unsupported divination',()=>{
 for(const [q,pattern] of [['돈이 새기 쉬운 부분은?',/지출|수입/],['이직을 고민해요',/직장|업무/],['상대와 관계를 개선하고 싶어요',/상대|경계/]]){const list=core.followups(q,'');assert.equal(list.length,2);assert(list.every(x=>pattern.test(x)));assert(list.every(x=>!/용신|행운|숫자|색상|투자상품|2027/.test(x)));assert(!core.followups(q,'',list.map(content=>({role:'user',content}))).some(x=>list.includes(x)));}
});
test('followup click prepares a question without calling the API; locked access remains gated',()=>{
 const html=fs.readFileSync('index.html','utf8'),source=html.slice(html.indexOf('function showAiFollowups('),html.indexOf('const AI_PENDING_PAID_QUESTION_KEY'));
 for(const locked of [false,true]){const controls=[],win={appendChild(){}},calls=[];const ctx={document:{getElementById:()=>win,createElement:()=>{const n={appendChild(){},append(){}};controls.push(n);return n;}},clearAiFollowupSuggestions(){},aiFollowupSet:()=>['후속 질문'],openAiFollowupPurchase:q=>calls.push('locked:'+q),trackAiFunnel(){},prepareAiQuestion:q=>calls.push('draft:'+q),quickAskAiChat(){throw Error('must not auto-send');},showAiOtherSajuTopics(){},scrollAiChatToBottom(){}};vm.runInNewContext(source,ctx);ctx.showAiFollowups('질문','답변',1,3,locked);controls.find(x=>String(x.textContent).includes('후속 질문')).onclick();assert.deepEqual(calls,[locked?'locked:후속 질문':'draft:후속 질문']);}
});
test('device annotations are scoped by verified account and can be removed on account deletion',()=>{
 const local=new Map(),session=new Map(),adapter=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});let owner='A';const store=accounts.createStore(adapter(local),adapter(session),()=>owner),key='taekilso_reading_library_v1';store.setItem(key,JSON.stringify({notes:{chat:'private'},saved:[{text:'answer'}]}));owner='B';assert.equal(store.getItem(key),null);owner='A';assert.equal(core.parse(store.getItem(key)).notes.chat,'private');store.removeOwner([key],'A');assert.equal(store.getItem(key),null);
});
test('invalid local state is not interpreted as a library and report identity includes the profile',()=>{
 for(const raw of ['undefined','[]','null','broken'])assert.deepEqual(core.parse(raw),{});
 assert.notEqual(core.hash(JSON.stringify([{date:'1990-01-01'},'same report'])),core.hash(JSON.stringify([{date:'1991-01-01'},'same report'])));
});
