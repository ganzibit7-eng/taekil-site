const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('./campaign-attribution-core');
test('campaign capture includes allowlisted fields, never a full query, token or referrer path',()=>{
 const v=C.capture('https://taekilso.com/free-saju/?utm_source=naver&utm_campaign=newyear&token=secret&birth=19900101','https://example.com/private?email=secret',10000);
 assert.deepEqual(v,{version:1,source:'naver',medium:'referral',campaign:'newyear',content:'',landingPath:'/free-saju/',capturedAtMs:10000});assert(!JSON.stringify(v).includes('secret'));assert(!JSON.stringify(v).includes('19900101'));
});
test('direct return keeps a recent campaign but expired and malformed data cannot attach to an order',()=>{
 const paid=C.capture('https://taekilso.com/?utm_source=naver&utm_campaign=one','',10000),direct=C.capture('https://taekilso.com/','',20000);assert.equal(C.select(paid,direct,20000).campaign,'one');assert.equal(C.select(paid,direct,31*86400000).source,'direct');assert(!C.valid({...paid,source:'<script>'},20000));assert(!C.valid({...paid,capturedAtMs:Infinity},20000));
});
test('browser telemetry cannot write confirmed payment or first-answer events and contains no direct database mutations',()=>{
 const source=fs.readFileSync('campaign-attribution.js','utf8');assert(!/\.collection\(/.test(source));assert(source.includes("['purchases','firstAiAnswers','freeLimitExhausted']"));assert(source.includes('await firebaseAuthSettled'));assert(source.includes('canRecordVisitorAnalytics()'));assert(!source.includes('sajuProfile'));
});
