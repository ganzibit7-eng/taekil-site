const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const app = fs.readFileSync('index.html', 'utf8');
const client = fs.readFileSync('checkout-availability.js', 'utf8');

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
  const context = vm.createContext({ window: {}, document: { documentElement }, showToast: (message) => toast.push(message) });
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

  for (const name of ['payPremium', 'purchaseQuestionPack']) {
    const source = app.match(new RegExp(`async function ${name}\\([^]*?\\n}`))?.[0];
    assert(source, `Missing payment entry point ${name}`);
    // Authentication, order writes, and PayApp are intentionally absent in this VM.
    await vm.runInContext(`(${source})('ai_question_pack_5')`, context);
    assert.match(toast.at(-1), /신규 결제를 잠시 중단/);
  }

  publish({ enabled: true });
  fail();
  assert.equal(checkout.requireOpen(), false);
});
