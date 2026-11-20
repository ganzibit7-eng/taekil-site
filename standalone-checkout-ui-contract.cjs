'use strict';
const changes=require('./standalone-checkout-ui-contract.json');

// Compare unaffected scripts to the historical fixture while allowing the
// separately tested retirement of the premium purchase flow and profile labels.
module.exports=source=>changes.reduce((text,[after,before])=>text.replace(after,()=>before),source);
