/* Owner confirmed all orders existing at this instant were test orders.
 * This reporting policy never deletes orders or changes entitlements. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TaekilPaymentBaseline=factory();})(typeof window!=='undefined'?window:this,function(){
  const cutoff=Date.parse('2026-11-10T16:36:26Z');
  function time(v){if(v&&typeof v.toMillis==='function')return v.toMillis();if(v&&typeof v.seconds==='number')return v.seconds*1000;if(typeof v==='number')return v;return typeof v==='string'?Date.parse(v):NaN;}
  function isProductionOrder(order){const created=time(order.createdAt);return Number.isFinite(created)&&created>cutoff&&order.isTest!==true;}
  return {cutoff,isProductionOrder};
});
