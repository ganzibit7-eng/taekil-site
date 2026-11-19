const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('./campaign-attribution-core');
test('only a campaign label from this visit is read',()=>{
 const campaign=query=>C.campaignFromUrl('https://taekilso.com/?'+query);
 assert.equal(campaign('utm_campaign=겨울 상담&utm_content=private&email=test@example.com'),'겨울 상담');
 assert.equal(campaign('n_campaign=cmp-a001-01-00000012345'),'cmp-a001-01-00000012345');
 for(const q of ['','utm_source=naver','utm_campaign=user@example.com','utm_campaign=010-1234-5678','n_keyword=private'])assert.equal(campaign(q),'');
});
test('orders and client rules accept no campaign fields',()=>{
 assert.doesNotMatch(fs.readFileSync('src/home/checkout.js','utf8'),/attribution|utm_campaign/);
 const rules=fs.readFileSync('firebase/firestore.rules','utf8').split('match /paymentOrders/')[1].split('match /inquiries/')[0];
 assert.doesNotMatch(rules,/attribution|campaign/);
});
test('browser telemetry cannot write confirmed payment or first-answer events and contains no direct database mutations',()=>{
 const source=fs.readFileSync('campaign-attribution.js','utf8');assert(!/\.collection\(/.test(source));assert(source.includes("['purchases','firstAiAnswers','freeLimitExhausted']"));assert(source.includes('await firebaseAuthSettled'));assert(source.includes('canRecordVisitorAnalytics()'));assert(!source.includes('sajuProfile'));
});
