const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(__dirname+'/../_worker.js')).toString('base64')).then(m=>m.default);
test('only the exact callback path invokes the worker, never public assets',async()=>{
 const routes=JSON.parse(fs.readFileSync(__dirname+'/../_routes.json'));assert.deepEqual(routes,{version:1,include:['/api/payapp-feedback'],exclude:[]});
 const worker=await load(),r=await worker.fetch(new Request('https://taekilso.com/'),{ASSETS:{fetch:()=>new Response('home')}});assert.equal(await r.text(),'home');
});
test('callback forwarding uses one fixed server, preserves form and SUCCESS, and never forwards caller authorization',async()=>{
 const original=global.fetch,worker=await load();let calls=0;
 try{global.fetch=async(url,options)=>{
  calls++;assert.equal(url,'https://taekilso-api-jhqz3vlila-du.a.run.app/api/payapp-feedback');assert.equal(options.redirect,'manual');assert.equal(new Headers(options.headers).get('authorization'),null);
  assert.equal(await new Response(options.body).text(),'var1=fixture&linkval=synthetic');return new Response('SUCCESS');
 };
 const result=await worker.fetch(new Request('https://taekilso.com/api/payapp-feedback?target=https://untrusted.invalid',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',authorization:'Bearer ignored'},body:'var1=fixture&linkval=synthetic'}),{});
 assert.equal(calls,1);assert.equal(await result.text(),'SUCCESS');assert.equal(result.headers.get('cache-control'),'no-store');
 }finally{global.fetch=original;}
});
test('invalid method and oversized declared body do not invoke any upstream',async()=>{
 const worker=await load();assert.equal((await worker.fetch(new Request('https://taekilso.com/api/payapp-feedback'),{})).status,405);
 assert.equal((await worker.fetch(new Request('https://taekilso.com/api/payapp-feedback',{method:'POST',headers:{'content-length':'4500001'}}),{})).status,413);
});
test('upstream errors and redirects fail closed without redirecting a payment payload',async()=>{
 const original=global.fetch,worker=await load();try{
  for(const upstream of [async()=>{throw Error('private failure');},async()=>new Response(null,{status:302,headers:{location:'https://untrusted.invalid'}})]){
   global.fetch=upstream;const r=await worker.fetch(new Request('https://taekilso.com/api/payapp-feedback',{method:'POST',body:'fixture'}),{});assert.equal(r.status,502);assert.equal(await r.text(),'UPSTREAM_ERROR');
  }
 }finally{global.fetch=original;}
});
