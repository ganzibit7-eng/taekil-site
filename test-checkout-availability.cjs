const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const app = fs.readFileSync('index.html', 'utf8');
const client = fs.readFileSync('checkout-availability.js', 'utf8');
const annual = fs.readFileSync('newyear-consultation.js','utf8').match(/async function purchase\(\)\{[\s\S]*?\n  \}/)[0];

test('checkout opens only on an explicit server setting and closes again without a reload', async () => {
  const attributes = new Set();
  const documentElement = {
    toggleAttribute(name, enabled) {
      if (enabled) attributes.add(name);
      else attributes.delete(name);
    },
    removeAttribute: (name) => attributes.delete(name),
    hasAttribute: (name) => attributes.has(name)
  };
  const toast = [];
  const context = vm.createContext({ window: {addEventListener() {}}, document: { documentElement }, showToast: (message) => toast.push(message) });
  vm.runInContext(client, context);
  const checkout = context.window.TaekilCheckout;

  let receive;
  let fail;
  checkout.watch({
    collection(name) {
      assert.equal(name, 'siteSettings');
      return { doc(id) {
        assert.equal(id, 'checkout');
        return { onSnapshot(options, onNext, onError) {
          assert.equal(options.includeMetadataChanges, true);
          receive = onNext;
          fail = onError;
        } };
      } };
    }
  });
  const publish = (data, fromCache = false) => receive({ data: () => data, metadata: { fromCache } });

  assert.equal(checkout.requireOpen(), false);
  for (const value of [undefined, {}, { enabled: 'true' }, { enabled: false }]) {
    publish(value);
    assert.equal(checkout.requireOpen(), false);
  }
  publish({ enabled: true }, true);
  assert.equal(checkout.requireOpen(), false);
  publish({ enabled: true });
  assert.equal(checkout.requireOpen(), true);
  publish({ enabled: false });
  assert.equal(checkout.requireOpen(), false);

  for (const source of [annual,app.match(/async function purchaseQuestionPack\([^]*?\n}/)?.[0]]) {
    assert(source, 'Missing payment entry point');
    // Authentication, order writes, and PayApp are intentionally absent in this VM.
    await vm.runInContext(`(${source})('ai_question_pack_5')`, context);
    assert.match(toast.at(-1), /신규 결제를 잠시 중단/);
  }

  publish({ enabled: true });
  fail();
  assert.equal(checkout.requireOpen(), false);
});

test('pack and annual report share one lock through handoff, restoring on failure and browser back', async () => {
  const root = new Set(['data-checkout-open']);
  const button = {disabled: false};
  const events = {};
  const context = vm.createContext({
    document: {
      querySelectorAll: () => [button],
      documentElement: {
        hasAttribute: key => root.has(key), setAttribute: key => root.add(key),
        removeAttribute: key => root.delete(key)
      }
    },
    window: {addEventListener: (name, callback) => { events[name] = callback; }}
  });
  vm.runInContext(client, context);
  vm.runInContext(app.match(/async function purchaseQuestionPack\([^]*?\n}/)[0], context);
  vm.runInContext(annual,context);
  let calls = 0, annualCalls=0, finish;
  Object.assign(context,{
    loggedIn:()=>true,active:true,accountStore:{snapshot:()=>({}),current:()=>true},
    content:{querySelector:()=>({disabled:false})},load:async()=>{},message:()=>{},
    request:async()=>{annualCalls++;return {state:'owned'};}
  });
  context.startQuestionPackCheckout = () => { calls++; return new Promise(resolve => {finish = resolve;}); };
  const first = context.purchaseQuestionPack('ai_question_pack_5');
  assert.equal(button.disabled, true);
  await context.purchaseQuestionPack('ai_question_pack_5');
  await context.purchase();
  assert.equal(calls, 1);
  assert.equal(annualCalls,0);
  finish(true);
  await first;
  await context.purchase();
  assert.equal(annualCalls,0);
  events.pageshow({persisted: true});
  assert.equal(button.disabled, false);
  context.request=async()=>{throw new Error('test payment unavailable');};
  await context.purchase();
  assert.equal(button.disabled, false);
  context.request=async()=>{annualCalls++;return {state:'owned'};};
  await context.purchase();
  assert.equal(button.disabled, false);
  assert.equal(annualCalls,1);
});
