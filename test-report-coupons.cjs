const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const src = fs.readFileSync(require.resolve('./report-coupons.js'),'utf8');
const product = 'taekilso_dogyeom_story_report';
const now = Date.now();
const pass = (id,expiresAtMs) => ({product, state:'available', couponId:id, expiresAtMs});
function client(reply, uid = 'member') {
  let owner = uid, generation = 0;
  const calls = [];
  const store = {
    snapshot:() => ({owner,generation}),
    current:token => token.owner === owner && token.generation === generation
  };
  const window = {accountStore:store};
  vm.runInNewContext(src,{
    window, document:{readyState:'loading', addEventListener() {}},
    getAiRequestHeaders:async () => ({Authorization:'Bearer fixture'}),
    AI_CHAT_URL:'https://api.example/api/ai-chat', AbortSignal,
    async fetch(url, options) {
      const q = JSON.parse(options.body);
      assert.equal(url,'https://api.example/api/report-coupons');
      assert.equal(options.cache,'no-store');
      calls.push(q);
      const data = await reply(q);
      return {ok:data.ok, status:data.ok ? 200 : 409, json:async () => data};
    }
  });
  return {api:window.TaekilReportCoupons, calls, store, change(next) { owner = next; generation++; }};
}
test('wallet chooses the first expiring matching available pass, shares one read and refreshes after use',async () => {
  const passes = [pass('later',now+50000),pass('first',now+20000),pass('expired',now-1),
    {...pass('used',now+10000), state:'used'}, {...pass('other',now+9000), product:'taekilso_date_report'}];
  const {api,calls} = client(async () => ({ok:true, passes}));
  const results = await Promise.all([api.available(product),api.available(product)]);
  assert.equal(results[0].couponId,'first');
  assert.equal(results[1].couponId,'first');
  assert.equal(calls.length,1);
  api.invalidate();
  assert.equal((await api.available(product)).couponId,'first');
  assert.equal(calls.length,2);
});
test('client validates and normalizes codes before sending, registers against the session, invalidates its wallet',async () => {
  const {api,calls} = client(async q => q.action === 'wallet' ? {ok:true,passes:[]} : {ok:true, pass:pass('ok',now+30000)});
  await api.available(product);
  await assert.rejects(api.redeem('invalid'), /32자리/);
  await api.redeem('abcd-abcd abcd-abcd-abcd-abcd-abcd-abcd');
  assert.deepEqual(calls[1], {action:'redeem',code:'ABCD'.repeat(8)});
  await api.available(product);
  assert.equal(calls.length,3);
});
test('stale-account wallet responses and stale registration snapshots are discarded', async () => {
  let release;
  const first = new Promise(resolve => {release = resolve;});
  let old = true;
  const {api,store,change,calls} = client(async () => {
    if (old) await first;
    return {ok:true, passes:[pass(old ? 'old' : 'new',now+40000)]};
  });
  const token = store.snapshot();
  const pending = api.available(product,token);
  await new Promise(resolve => setImmediate(resolve));
  change('other');
  old = false;
  release();
  await assert.rejects(pending,/로그인/);
  await assert.rejects(api.redeem('ABCD'.repeat(8),token),/로그인/);
  assert.equal((await api.available(product)).couponId,'new');
  assert.equal(calls.length,2);
});
test('guests cannot resolve or register a coupon, rejection does not poison future wallet reads',async () => {
  let fail = true;
  const {api,calls,change} = client(async () => {
    if (fail) throw Error('connection');
    return {ok:true,passes:[]};
  },null);
  assert.equal(await api.available(product),null);
  await assert.rejects(api.redeem('ABCD'.repeat(8)),/로그인/);
  assert.equal(calls.length,0);
  change('member');
  await assert.rejects(api.available(product),/서버 응답/);
  fail = false;
  assert.equal(await api.available(product),null);
  assert.equal(calls.length,2);
});
