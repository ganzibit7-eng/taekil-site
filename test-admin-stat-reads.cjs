const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('./admin-stat-reads.js'), 'utf8');
function fixture(statuses, rows) {
  const queries = [];
  const window = {TaekilAnalytics:require('./admin-analytics-core.js')};
  vm.runInNewContext(source, {window, AbortController, setTimeout, clearTimeout, fetch:async (url, options) => {
    assert.equal(url, 'https://firestore.googleapis.com/v1/projects/demo/databases/(default)/documents:runQuery');
    assert.equal(options.headers.Authorization, 'Bearer fixture');
    queries.push(JSON.parse(options.body).structuredQuery);
    const status = statuses.shift() ?? 200;
    return {ok:status===200, status, json:async()=>rows};
  }});
  const controller = new AbortController();
  const reader = window.TaekilStatReads.create('demo', {getIdToken:async()=>'fixture'}, controller.signal);
  return {reader,queries,controller};
}
test('range queries retry temporary failures and preserve document IDs, campaign dates and counts', async () => {
  const {reader,queries} = fixture([503,200], [{document:{name:'dailyVisits/2026-11-26', fields:{count:{integerValue:'23'}}}}]);
  const result = await reader.daily('dailyVisits','2026-10-28','2026-11-26');
  assert.equal(result.docs[0].id,'2026-11-26');
  assert.equal(result.docs[0].data().count,23);
  assert.deepEqual(queries[0],queries[1]);
  const filters = queries[0].where.compositeFilter.filters;
  assert.equal(filters[0].fieldFilter.field.fieldPath,'__name__');
  assert.match(filters[1].fieldFilter.value.referenceValue,/\/dailyVisits\/2026-11-26$/);
  await reader.daily('dailyCampaignVisits','2026-10-28','2026-11-26');
  assert.deepEqual(queries[2].where.compositeFilter.filters[0].fieldFilter.value,{stringValue:'2026-10-28'});
});
test('permission denial and cancelled sessions never retry or return empty statistics', async () => {
  const {reader,queries,controller} = fixture([403], []);
  await assert.rejects(reader.orders('2026-11-01'),{code:'permission-denied'});
  assert.equal(queries.length,3);
  controller.abort();
  await assert.rejects(reader.daily('dailyVisits','2026-11-01','2026-11-26'),{code:'cancelled'});
  assert.equal(queries.length,3);
});
test('order reads request only reporting fields and deduplicate overlapping timestamp indexes', async () => {
  const {reader,queries} = fixture([], [{document:{name:'paymentOrders/example',fields:{paidAt:{timestampValue:'2026-11-23T02:35:49Z'}}}}]);
  const result = await reader.orders('2026-11-01');
  assert.equal(result.docs.length,1);
  assert.equal(result.docs[0].data().paidAt,'2026-11-23T02:35:49Z');
  for (const q of queries) {
    assert.equal(q.limit,1001);
    assert.ok(q.select.fields.some(f=>f.fieldPath==='entitlementReviewRequired'));
    assert.ok(q.select.fields.every(f=>!['uid','email','attribution'].includes(f.fieldPath)));
  }
});
