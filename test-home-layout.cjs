const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const entry = readFileSync(__dirname + '/home-layout.js', 'utf8');
const layoutAt = path => {
  const location = new URL(path, 'https://taekilso.com/');
  const originalUrl = location.href;
  const dataset = {};
  runInNewContext(entry, { URLSearchParams, location, document: { documentElement: { dataset } } });
  assert.equal(location.href, originalUrl);
  return dataset.homeLayout;
};

test('organic traffic and ordinary campaign visits open the service directory', () => {
  for (const path of ['/', '/#newyear', '/?utm_source=naver', '/?utm_source=naver&utm_medium=organic', '/?utm_source=instagram&utm_medium=cpc']) {
    assert.equal(layoutAt(path), 'directory', path);
  }
});

test('the explicit ad URL, legacy Naver ad links and guide links open the original consultation landing', () => {
  for (const path of [
    '/?landing=yeonwoo',
    '/?landing=yeonwoo&utm_source=naver&utm_campaign=brand#newyear',
    '/?n_media=27758&n_ad=nad-123&n_query=%EC%82%AC%EC%A3%BC',
    '/?utm_source=NAVER&utm_medium=CPC',
    '/?nclid=naver-click',
    '/?seo_landing=career-fortune#ai-chat',
    '/?seo_landing=career-fortune#newyear',
    '/#ai-chat'
  ]) {
    assert.equal(layoutAt(path), 'consultation', path);
  }
});
