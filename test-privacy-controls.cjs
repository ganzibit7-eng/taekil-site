const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

test('age refusal prevents AI disclosure and an accepted tab clears consent at logout', () => {
  const answers = [false, true, false, true, false];
  const rows = new Map([['taekilso_kakao_access_token','obsolete']]);
  const window = {confirm:() => answers.shift()};
  const sessionStorage = {getItem:key => rows.get(key), setItem:(key,val) => rows.set(key,val), removeItem:key => rows.delete(key)};
  vm.runInNewContext(readFileSync('privacy-controls.js','utf8'), {window,sessionStorage,document:{addEventListener(){}}});
  assert.equal(rows.has('taekilso_kakao_access_token'),false);
  assert.equal(window.TaekilPrivacy.confirmAI(),false);
  assert.equal(window.TaekilPrivacy.confirmAI(),false);
  assert.equal(window.TaekilPrivacy.confirmAI(),true);
  assert.equal(window.TaekilPrivacy.confirmAI(),true);
  window.TaekilPrivacy.resetAge();
  assert.equal(window.TaekilPrivacy.confirmAI(),false);
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
