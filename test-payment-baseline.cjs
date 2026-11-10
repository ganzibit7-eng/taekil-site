const test=require('node:test'),assert=require('node:assert/strict');
const policy=require('./admin-payment-baseline');
test('existing test orders stay excluded after delayed payment and new orders remain eligible',()=>{
 const old={createdAt:policy.cutoff,paidAt:policy.cutoff+3600000,status:'paid'};
 assert.equal(policy.isProductionOrder(old),false);
 assert.equal(policy.isProductionOrder({createdAt:policy.cutoff+1}),true);
 assert.equal(policy.isProductionOrder({createdAt:policy.cutoff+1,isTest:true}),false);
 assert.equal(policy.isProductionOrder({}),false);
 assert.equal(policy.isProductionOrder({createdAt:{toMillis:()=>policy.cutoff+1}}),true);
 assert.deepEqual(old,{createdAt:policy.cutoff,paidAt:policy.cutoff+3600000,status:'paid'});
});
