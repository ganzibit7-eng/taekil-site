const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

test('consent is a separate pre-entry screen with cancellation, repeat entry, and logout', async () => {
  const rows = new Map([['taekilso_kakao_access_token','obsolete']]);
  const window = {confirm:() => false,addEventListener(){},accountStore:{owner:()=> 'member',snapshot:()=>({}),current:()=>true}};
  const checkbox = {checked:false,focus(){}};
  let click; const confirmButton={disabled:false}, progress={textContent:''};
  const screen = {hidden:true,querySelector:selector=>selector.startsWith('[data-') ? confirmButton : {focus(){}},scrollIntoView(){},addEventListener(_,fn){click=fn;},removeEventListener(){click=null;}};
  const view = {classList:{contains:()=>true}};
  const host = {closest:()=>view,before(){},setAttribute(){},removeAttribute(){}};
  const document = {getElementById:id=>({authAgeConfirmed:checkbox,aiTransferScreen:screen,aiConsentSaveStatus:progress}[id]),addEventListener(){}};
  const sessionStorage = {getItem:k=>rows.get(k),setItem:(k,v)=>rows.set(k,v),removeItem:k=>rows.delete(k)};
  let saved={noticeVersion:'2026-11-19-v1',revision:0,state:'not_granted'};
  const fetch=async(_url,{body})=>{
    if(JSON.parse(body).operation==='grant') saved={...saved,revision:1,state:'granted'};
    return {ok:true,json:async()=>saved};
  };
  vm.runInNewContext(readFileSync('privacy-controls.js','utf8'), {window,document,sessionStorage,URLSearchParams,fetch,AbortSignal,AI_CHAT_URL:'test:',getAiRequestHeaders:async()=>({Authorization:'Bearer fixture'}),location:{search:'',hash:''},MutationObserver:class{observe(){}disconnect(){}}});
  const privacy=window.TaekilPrivacy;
  assert.equal(rows.has('taekilso_kakao_access_token'),false);
  assert.equal(privacy.confirmSignupAge(),false);
  checkbox.checked=true;
  assert.equal(privacy.confirmSignupAge(),true);
  assert.equal(privacy.hasAIConsent(),false);
  const cancel=privacy.confirmAI(host);await new Promise(setImmediate);
  assert.equal(screen.hidden,false);
  click({target:{closest:()=>({dataset:{aiConsent:'cancel'}})}});
  assert.equal(await cancel,false);
  const accept=privacy.confirmAI(host);await new Promise(setImmediate);
  click({target:{closest:()=>({dataset:{aiConsent:'agree'}})}});
  assert.equal(await accept,true);
  assert.equal(screen.hidden,true);
  assert.equal(privacy.hasAIConsent(),true);
  privacy.resetAge();
  assert.equal(privacy.hasAIConsent(),false);
  assert.equal(rows.size,0);
  assert.equal(await privacy.confirmAI(host),true);
});

test('closed checkout cannot load a third-party payment script', async () => {
  const window = {addEventListener(){}};
  vm.runInNewContext(readFileSync('checkout-availability.js','utf8'), {window,document:{documentElement:{hasAttribute:()=>false}},showToast(){}});
  assert.equal(await window.TaekilCheckout.loadSdk(),false);
  const template = readFileSync('src/home/page.template','utf8');
  assert.doesNotMatch(template, /<script[^>]*src="https:\/\/lite\.payapp/);
  for (const [tag] of template.matchAll(/<script src="https:\/\/[^>]+>/g)) assert.match(tag,/integrity="sha384-[^"]{64}"/);
});
