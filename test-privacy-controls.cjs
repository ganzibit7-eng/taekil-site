const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

test('signup and AI transfer require separate affirmative actions and logout clears them', async () => {
  const rows = new Map([['taekilso_kakao_access_token','obsolete']]);
  const window = {confirm:() => false};
  const checkbox = {checked:false, focus() {}};
  let close;
  const dialog = {
    open:false, showModal() {this.open=true;},
    addEventListener(event,fn) {assert.equal(event,'close');close=fn;},
    close(value) {this.open=false;this.returnValue=value;close();}
  };
  const document = {getElementById:id=>({authAgeConfirmed:checkbox,aiTransferDialog:dialog}[id]), addEventListener(){}};
  const sessionStorage = {getItem:key => rows.get(key), setItem:(key,val) => rows.set(key,val), removeItem:key => rows.delete(key)};
  vm.runInNewContext(readFileSync('privacy-controls.js','utf8'), {window,sessionStorage,document,URLSearchParams,location:{search:'',hash:''}});
  assert.equal(rows.has('taekilso_kakao_access_token'),false);
  assert.equal(window.TaekilPrivacy.confirmSignupAge(),false);
  assert.equal(window.TaekilPrivacy.confirmAI(),false);
  checkbox.checked=true;
  assert.equal(window.TaekilPrivacy.confirmSignupAge(),true);
  const refused=window.TaekilPrivacy.confirmAI();
  assert.equal(dialog.open,true); dialog.close('cancel');
  assert.equal(await refused,false);
  const accepted=window.TaekilPrivacy.confirmAI();
  assert.equal(window.TaekilPrivacy.confirmAI(),accepted);
  dialog.close('agree');
  assert.equal(await accepted,true);
  assert.equal(window.TaekilPrivacy.confirmAI(),true);
  window.TaekilPrivacy.resetAge();
  assert.equal(window.TaekilPrivacy.confirmAI(),false);
  assert.equal(checkbox.checked,false);
  assert.equal(rows.size,0);
});

test('closed checkout cannot load a third-party payment script', async () => {
  const window = {addEventListener(){}};
  vm.runInNewContext(readFileSync('checkout-availability.js','utf8'), {window,document:{documentElement:{hasAttribute:()=>false}},showToast(){}});
  assert.equal(await window.TaekilCheckout.loadSdk(),false);
  const template = readFileSync('src/home/page.template','utf8');
  assert.doesNotMatch(template, /<script[^>]*src="https:\/\/lite\.payapp/);
  for (const [tag] of template.matchAll(/<script src="https:\/\/[^>]+>/g)) assert.match(tag,/integrity="sha384-[^"]{64}"/);
});
