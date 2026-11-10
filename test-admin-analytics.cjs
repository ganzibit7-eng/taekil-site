const assert=require('node:assert/strict');
const A=require('./admin-analytics-core.js');
const ms=s=>Date.parse(s);
assert.equal(A.dateKey(ms('2026-11-09T15:00:00Z')),'2026-11-10');
assert.equal(A.dateKey(ms('2026-11-09T14:59:59Z')),'2026-11-09');
assert.deepEqual(A.keys('2026-11-01',3),['2026-10-30','2026-10-31','2026-11-01']);
assert.equal(A.orderTime({pay_date:'20261110000100',createdAt:ms('2026-11-09T00:00:00Z')}),ms('2026-11-09T15:01:00Z'));
const data={orders:[
 {status:'paid',product:'ai_question_pack_5',amount:1900,createdAt:{toMillis:()=>ms('2026-11-09T15:00:00Z')}},
 {status:'pending',product:'taekilso_premium_30days',amount:8900,createdAt:ms('2026-11-10T00:00:00Z')},
 {status:'paid',product:'taekilso_premium_30days',amount:8900,pay_date:'20261109235959'},
 {status:'paid',product:'other',amount:100,createdAt:ms('2026-11-10T00:00:00Z')},
 {status:'refunded',amount:8900,createdAt:ms('2026-11-10T00:00:00Z')},
 {status:'paid',amount:1900}
],visits:[{id:'2026-11-09',count:50},{id:'2026-11-10',count:10}],funnel:[{id:'2026-11-10',signups:2,firstAiAnswers:4}],traffic:[{id:'2026-11-10',search:6,direct:4}],seo:[{date:'2026-11-10',slug:'wealth',visits:3,purchases:1}]};
const r=A.aggregate(data,'2026-11-10','2026-11-10');
assert.equal(r.revenue,2000);assert.equal(r.paid,2);assert.equal(r.aov,1000);assert.equal(r.visits,10);assert.equal(r.signups,2);assert.equal(r.series.length,1);assert.equal(r.series[0].revenue,2000);assert.equal(r.products.find(x=>x.id==='other').count,1);assert.equal(r.seo[0].purchases,1);assert.equal(r.events.find(x=>x.name==='첫 AI 답변').value,4);
const empty=A.aggregate({...data,orders:[]},'2026-11-08','2026-11-08');assert.equal(empty.aov,null);assert.equal(empty.visits,0);assert.equal(empty.series.length,1);
assert.equal(A.change(10,0),null);assert.equal(A.change(15,10),50);assert.equal(A.change(0,10),-100);
assert.deepEqual(A.baseline({purchases:13,revenue:33200}),{count:0,revenue:0});assert.deepEqual(A.baseline({purchases:14,revenue:35100}),{count:1,revenue:1900});assert.equal(A.baseline({purchases:12,revenue:33200}),null);
assert.equal(A.number(-1),0);assert.equal(A.number('oops'),0);
console.log('PASS: KST boundaries, date ranges, actual payment dates, paid-only totals, product reconciliation, unknown products, empty periods, average order amount, independent events, period comparisons and test-payment baseline.');

assert.equal(r.reportInstrumented,false);
const reportData=A.aggregate({...data,funnel:[{id:'2026-11-10',freeReportViews:12,freeReportCompleted:8,reportCtaClicks:5,reportQuestionClicks:3,reportSignupStarts:3,reportSignups:2,reportFirstQuestions:1}]},'2026-11-10','2026-11-10');
assert.equal(reportData.reportInstrumented,true);assert.deepEqual(reportData.reportEvents.map(x=>x.value),[12,8,5,3,3,2,1]);assert.equal(reportData.revenue,r.revenue);
console.log('PASS: dedicated report steps preserve existing payment totals and distinguish absent instrumentation.');

for(const state of [8,32,9,64,70,71]){
 assert.equal(A.settledPaid({status:'paid',pay_state:state}),false);
 assert.equal(A.settledPaid({status:'paid',pay_state:4,lastPayState:state}),false);
}
for(const patch of [{status:'cancelled'},{status:'refunded'},{status:'partially_refunded'},{refundedAmount:100},{cancelledAtMs:1},{entitlementRevokedAtMs:1}])assert.equal(A.settledPaid({status:'paid',pay_state:4,...patch}),false);
assert.equal(A.settledPaid({status:'paid',pay_state:4,lastPayState:4}),true);
const attributed=A.aggregate({...data,orders:[{status:'paid',pay_state:4,amount:1900,createdAt:ms('2026-11-10T00:00:00Z'),attribution:{source:'naver',medium:'cpc',campaign:'winter'}},{status:'partially_refunded',pay_state:4,amount:8900,refundedAmount:100,createdAt:ms('2026-11-10T00:00:00Z'),attribution:{source:'naver',medium:'cpc',campaign:'winter'}}]},'2026-11-10','2026-11-10');
assert.deepEqual(attributed.campaigns,[{source:'naver',medium:'cpc',campaign:'winter',count:1,revenue:1900}]);assert.equal(attributed.revenue,1900);
console.log('PASS: cancelled/partially-refunded payments excluded and campaign-attributed completed revenue reconciles.');
