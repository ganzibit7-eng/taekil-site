const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const baselineRef='d7bd53ed709f19d5ffb633b622dcae97158de697';
const baseline=cp.execFileSync('git',['show',baselineRef+':index.html'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
const current=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
const scripts=html=>[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(m=>[m[1],m[2]]);
const originalScripts=scripts(current).filter(([attrs])=>!['campaign-attribution-core.js','campaign-attribution.js','account-session-core.js','account-session.js','site-menu.js','yeonwoo-video.js','newyear-example.js','admin-payment-baseline.js','premium-motion.js','admin-analytics-core.js','admin-analytics.js','consultation-stage.js','navigation-stability.js','newyear-consultation.js','free-report-handoff-core.js','free-report-handoff.js','navigation-refinement.js','profile-picker-controls.js','consultation-quality.js','support-channels.js'].some(src=>new RegExp('src="'+src.replaceAll('.', '\\.')+'(?:\\?[^"]*)?"').test(attrs)));
const accountChanges=JSON.parse(fs.readFileSync('account-ui-contract-changes.json','utf8'));
const normalizeAccounts=source=>accountChanges.slice().reverse().reduce((text,change)=>text.split(change.after).join(change.before),source);
const normalizeReport=source=>normalizeAccounts(source)
.replace('authDomain: "auth.taekilso.com"','authDomain: "taekilso.firebaseapp.com"')
.replaceAll('        ...(window.TaekilCampaign ? {attribution: window.TaekilCampaign.order()} : {}),\n','')
.replaceAll('하루 10개','하루 15개') // Explicitly authorized daily premium policy change; retain all other script invariants.
.replace('const limit = extra && Number.isFinite(Number(extra.premiumDailyLimit)) ? Number(extra.premiumDailyLimit) : 10;', 'const limit = extra && Number.isFinite(Number(extra.premiumDailyLimit)) ? Number(extra.premiumDailyLimit) : 15;')
.replace(/\/\* VISITOR_POLICY_START \*\/[\s\S]*?\/\* VISITOR_POLICY_END \*\/\n/,'')
.replace(/  \/\* VISITOR_GUARD_START \*\/[\s\S]*?  \/\* VISITOR_GUARD_END \*\//,'  if (isAdmin()) return;')
.replace(/  \/\* TRAFFIC_GUARD_START \*\/[\s\S]*?  \/\* TRAFFIC_GUARD_END \*\//,'  if(!db || isAdmin()) return;')
.replace(/  \/\* SEO_ADMIN_GUARD_START \*\/[\s\S]*?  \/\* SEO_ADMIN_GUARD_END \*\/\n/,'')
.replace(/        \/\* QUALITY_PAYLOAD_START \*\/[\s\S]*?        \/\* QUALITY_PAYLOAD_END \*\/\n/,'')
.replace(/    \/\* QUALITY_RESPONSE_START \*\/[\s\S]*?    \/\* QUALITY_RESPONSE_END \*\/\n/,'')
.replace(/  \/\* REPORT_MANUAL_OPTION_START \*\/[\s\S]*?  \/\* REPORT_MANUAL_OPTION_END \*\/\n/,'')
.replace(/      \/\* REPORT_SIGNUP_EVENT_START \*\/[\s\S]*?      \/\* REPORT_SIGNUP_EVENT_END \*\/\n/,'')
.replace(/    \/\* REPORT_QUESTION_EVENT_START \*\/[\s\S]*?    \/\* REPORT_QUESTION_EVENT_END \*\/\n/,'')
.replace(/    \/\* REPORT_RESULT_EVENT_START \*\/[\s\S]*?    \/\* REPORT_RESULT_EVENT_END \*\/\n/,'')
.replace('function startAiChat(reportOptions)', 'function startAiChat()')
.replace('if (!reportManual && getPendingPaidAiQuestion())','if (getPendingPaidAiQuestion())')
.replace("const storedTodayQuestion = reportManual ? '' : takeTodayFortunePendingQuestion();",'const storedTodayQuestion = takeTodayFortunePendingQuestion();')
.replace("const pendingQuestion = reportManual ? '' : (window.__pendingCategoryQuestion || storedTodayQuestion);",'const pendingQuestion = window.__pendingCategoryQuestion || storedTodayQuestion;');
const normalizeSeasonal=source=>normalizeReport(source).replace(/        \/\* NEWYEAR_SCOPE_START \*\/[\s\S]*?        \/\* NEWYEAR_SCOPE_END \*\/\n/,'').replace(/      \/\* NEWYEAR_RESPONSE_START \*\/[\s\S]*?      \/\* NEWYEAR_RESPONSE_END \*\/\n/,'').replace("goodname: '2027 신년상담 · 30일 이용권'","goodname: '택일소 프리미엄 30일 이용권'");
assert.deepEqual(originalScripts.map(([a,b])=>[a,normalizeSeasonal(b)]),scripts(baseline),'Existing inline and external scripts must remain exactly unchanged');
new Function(fs.readFileSync('premium-motion.js','utf8'));
new Function(fs.readFileSync('site-menu.js','utf8'));
const hooks=html=>[...html.matchAll(/\bon(?:click|change|input|keydown|submit)="[^"]*"/g)].map(m=>m[0]);
// UI controls may move to a new view. Only a leading return-to-home navigation was
// added to controls that previously lived on home; their original action remains.
const normalizeHook=hook=>hook.replace(/^onclick="goTo\('home'\);(?=handleHomeCategoryClick|openHomeDailyConsult|document\.querySelector)/,'onclick="');
const hookCounts=new Map();for(const hook of hooks(current)){const value=normalizeHook(hook);hookCounts.set(value,(hookCounts.get(value)||0)+1);}
for(const hook of hooks(baseline)){assert((hookCounts.get(hook)||0)>0,'Missing original action: '+hook);hookCounts.set(hook,hookCounts.get(hook)-1);}
const ids=html=>[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const currentIds=ids(current);
for(const id of ids(baseline))assert(currentIds.includes(id),'Missing existing element: '+id);
const segment=(html,start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
const stripBrand=html=>html.replace(/<svg\b(?=[^>]*\bdata-brand-symbol\b)[\s\S]*?<\/svg>/g,'');
assert.equal(stripBrand(segment(current,'<div class="topbar">','<!-- ============ AUTH MODAL')),segment(baseline,'<div class="topbar">','<!-- ============ AUTH MODAL'),'Header actions must remain unchanged apart from the requested logo');
const profile=html=>segment(html,'<div class="ai-chat-topbar-overlay">','<!-- STEP 0:').replace('<small>당신의 운을 함께 봐드리는 AI예요.</small>','').replace(/^[\t ]+$/gm,'');
assert.equal(profile(current),profile(baseline),'Original Yeonwoo profile image and name must remain unchanged');
assert(current.includes('https://lite.payapp.kr/public/api/v2/payapp-lite.js'));
assert(current.includes('api/ai-chat'));
for(const [,source]of scripts(current)){if(source.trim()&&!source.trim().startsWith('{'))new Function(source);}
assert(current.includes('id="view-plans"')&&current.includes('id="view-services"'));
const homeStart=current.indexOf('<section id="view-home"');const scan=/<section\b[^>]*>|<\/section>/gi;scan.lastIndex=homeStart;let depth=0,match,homeEnd;
while((match=scan.exec(current))){depth+=match[0].startsWith('</')?-1:1;if(depth===0){homeEnd=scan.lastIndex;break;}}
const home=current.slice(homeStart,homeEnd);assert(!home.includes('class="pricing-grid premium-plans"'),'Price table must be in its dedicated view');assert(!home.includes('id="home-date-section"'),'Date tools must be in their dedicated view');
assert(current.indexOf('class="seo-service-hub"')<current.indexOf('<footer>'),'Service guide must precede copyright/footer');
assert(!home.includes('당신의 운을 함께 봐드리는 AI예요.')&&!home.includes('class="home-conversion-kicker"'),'Requested video labels must be removed');
console.log('PASS: original scripts/actions, IDs, profile image/name, authentication, API and PG references preserved; home/utility separation and footer order verified.');
const detailFiles=cp.execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('/index.html')||f==='404.html');
const anchors=html=>[...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)].map(m=>m[1]);
for(const file of detailFiles){
 const original=cp.execFileSync('git',['show',baselineRef+':'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n');
 const updated=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
 assert(updated.includes('href="/premium-detail.css"'),file+': shared detail theme missing');
 assert.deepEqual(scripts(updated),scripts(original),file+': existing script changed');
 assert.deepEqual(anchors(updated),anchors(original),file+': navigation changed');
 const body=html=>stripBrand(html.slice(html.search(/<body\b/i))).replace(' class="premium-article"','').replace(/\bpremium-article\s*/,'');
 assert.equal(body(updated),body(original),file+': article content or FAQ markup changed');
}
console.log('PASS: '+detailFiles.length+' detail pages retain their original content, links, structured data and scripts.');
const actualExamples=JSON.parse(fs.readFileSync('content/consultation-examples.json','utf8'));
assert.equal(actualExamples.examples.length,3);
assert.deepEqual(actualExamples.birth,{calendar:'solar',year:1990,month:1,day:1,time:'unknown',gender:'unknown'});
const answers=[...home.matchAll(/<div class="ui-real-answer">([\s\S]*?)<\/div><\/details><\/details>/g)].map(m=>m[1]);
assert.equal(answers.length,3);
const entities={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '};
const textOnly=html=>html.replace(/<[^>]+>/g,' ').replace(/&(amp|lt|gt|quot|#39|nbsp);/g,m=>entities[m]);
const words=text=>text.replace(/^#+\s*/gm,'').replace(/---/g,'').replace(/\s+/g,'');
actualExamples.examples.forEach((example,i)=>assert.equal(words(textOnly(answers[i])),words(example.answer),'Actual answer wording changed: '+example.topic));
for(const name of ['welcome','reading','moonlight'])assert(fs.statSync('assets/yeonwoo-'+name+'.jpg').size>0);
assert.equal((current.match(/src="premium-motion.js"/g)||[]).length,1);
console.log('PASS: three actual consultation answers preserve all wording; story assets and presentation-only motion are present.');

for(const file of ['admin-analytics-core.js','admin-analytics.js'])new Function(fs.readFileSync(file,'utf8'));
assert.equal((current.match(/src="admin-analytics-core\.js(?:\?[^" ]*)?"/g)||[]).length,1);
assert.equal((current.match(/src="admin-analytics\.js(?:\?[^"]*)?"/g)||[]).length,1);
assert(current.includes('id="adminAnalytics" hidden'));
const analytics=fs.readFileSync('admin-analytics.js','utf8');
assert(!/\.(set|update|delete|add)\(/.test(analytics),'Reporting must not mutate database documents');
assert(analytics.includes('isAdmin()')&&analytics.includes("get({source:'server'})"));
console.log('PASS: new administrator analytics scripts compile, mount once behind the existing admin gate, and contain no database write calls.');

new Function(fs.readFileSync('consultation-stage.js','utf8'));

new Function(fs.readFileSync('navigation-stability.js','utf8'));

new Function(fs.readFileSync('newyear-consultation.js','utf8'));
assert(current.includes("consultationScope: window.__newyearChatContext ? 'newyear' : undefined"));
assert(current.includes("data.error === 'NEWYEAR_PASS_REQUIRED'"));

for(const f of ['free-report-handoff-core.js','free-report-handoff.js'])new Function(fs.readFileSync(f,'utf8'));

const footer=current.slice(current.indexOf('<footer>'),current.indexOf('</footer>'));assert.equal((footer.match(/class="footer-link"/g)||[]).length,3);for(const label of ['이용약관','개인정보처리방침','문의하기'])assert(footer.includes(label));assert(!footer.includes('이용권 안내')&&!footer.includes('서비스 안내'));new Function(fs.readFileSync('navigation-refinement.js','utf8'));

assert(current.includes('id="aiChatDeleteProfile"'));new Function(fs.readFileSync('profile-picker-controls.js','utf8'));
