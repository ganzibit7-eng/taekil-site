const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const entry = readFileSync(__dirname + '/home-layout.js', 'utf8');
const layoutAt = path => {
  const location = new URL(path, 'https://taekilso.com/');
  const originalUrl = location.href;
  const dataset = {};
  runInNewContext(entry, { URLSearchParams, location, document: { documentElement: { dataset }, addEventListener() {} } });
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

test('directory shortcuts focus and scroll to their headings without changing the home URL', () => {
  const location = new URL('https://taekilso.com/?utm_source=search');
  const headingId = 'directoryRelationshipsTitle';
  const calls = [];
  const heading = {
    focus(options) { calls.push(['focus', options.preventScroll]); },
    scrollIntoView(options) { calls.push(['scroll', options.block, options.behavior]); }
  };
  const button = {
    dataset: { directoryJump: headingId },
    addEventListener(type, handle) { assert.equal(type, 'click'); handle(); }
  };
  const document = {
    documentElement: { dataset: {} },
    addEventListener(type, handle) { assert.equal(type, 'DOMContentLoaded'); handle(); },
    querySelectorAll() { return [button]; },
    getElementById(id) { assert.equal(id, headingId); return heading; }
  };
  runInNewContext(entry, { URLSearchParams, location, document });
  assert.deepEqual(calls, [['focus', true], ['scroll', 'start', 'instant']]);
  assert.equal(location.href, 'https://taekilso.com/?utm_source=search');
});

test('the home FAQ starts folded in the directory and stays expanded on the ad landing', () => {
  const html = readFileSync(__dirname + '/index.html', 'utf8');
  const openingTag = html.match(/<details[^>]*\bid="homeFaqFold"[^>]*>/)?.[0];
  assert.ok(openingTag);
  assert.doesNotMatch(openingTag, /\bopen\b/);
  for (const path of ['/', '/?landing=yeonwoo']) {
    const faq = {open:false};
    const document = {
      documentElement: {dataset:{}},
      addEventListener(type, handle) { assert.equal(type, 'DOMContentLoaded'); handle(); },
      querySelectorAll() { return []; },
      getElementById(id) { assert.equal(id, 'homeFaqFold'); return faq; }
    };
    runInNewContext(entry, {URLSearchParams, location:new URL(path, 'https://taekilso.com'), document});
    assert.equal(faq.open, path.includes('landing=yeonwoo'));
  }
});

test('the public home uses a separate image for every displayed hero, portrait and topic', () => {
  const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const start = html.indexOf('id="homeDirectory"');
  const end = html.indexOf('<div class="block home-first-block"', start);
  const images = [...html.slice(start, end).matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(([, src]) => src);
  assert.ok(images.length >= 19);
  assert.equal(new Set(images).size, images.length);
  const hashes = images.map(src => createHash('sha256').update(readFileSync(path.join(__dirname, src))).digest('hex'));
  assert.equal(new Set(hashes).size, images.length);
});
