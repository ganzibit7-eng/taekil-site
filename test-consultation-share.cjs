const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const renderHome = require('./render-home.cjs');
const {pages, renderSharePage} = require('./render-consultation-share.cjs');
const origin = 'https://taekilso.com';
const home = renderHome();
const property = (html, key) => [...html.matchAll(new RegExp('<meta property="' + key + '" content="([^"]*)">', 'g'))].map(m => m[1]);

test('each public consultation gets one complete set of static sharing metadata', () => {
  const titles = new Set();
  assert.equal(Object.keys(pages).length, 24);
  for (const [topic, page] of Object.entries(pages)) {
    assert.match(topic, /^[a-z]+(?:-[a-z]+)*$/);
    const html = renderSharePage(home, topic);
    const head = html.slice(0, html.indexOf('</head>'));
    const url = origin + '/consultation/' + topic + '/';
    assert.deepEqual(property(head, 'og:title'), [page.title]);
    assert.deepEqual(property(head, 'og:description'), [page.description]);
    assert.deepEqual(property(head, 'og:url'), [url]);
    assert.deepEqual(property(head, 'og:image'), [origin + '/' + page.image]);
    assert.deepEqual(property(head, 'og:image:width'), [String(page.width)]);
    assert.deepEqual(property(head, 'og:image:height'), [String(page.height)]);
    assert.ok(head.includes('<link rel="canonical" href="' + url + '">'));
    assert.ok(head.includes('<base href="/">'));
    const bytes = fs.readFileSync(page.image);
    assert.equal(bytes.readUInt16BE(), 0xffd8, page.image + ' is a share-ready JPEG');
    assert.ok(page.width >= 300 && page.height >= 300);
    const route = topic === 'yeonwoo' ? 'home' : ['wedding','newyear'].includes(topic) ? topic : 'topic-' + topic;
    assert.ok(html.includes('data-share-route="' + route + '"') && html.includes('id="view-' + route + '"'));
    titles.add(page.title);
  }
  assert.equal(titles.size, Object.keys(pages).length);
  assert.equal(property(home,'og:title').length,1);
  assert.equal(property(home,'og:url').length,1);
  assert.ok(home.includes('href="#topic-reunion"'));
  assert.ok(home.includes('href="/?landing=yeonwoo'));
});

test('a saved share address restores its story and explicit legacy hashes still work', () => {
  const nav = fs.readFileSync('src/home/navigation.js', 'utf8');
  const start = nav.indexOf('function safeRoute');
  const end = nav.indexOf('// Direct links may need',start);
  const source = nav.slice(start,end);
  const dataset = {sharePath:'/consultation/reunion/',shareRoute:'topic-reunion'};
  const document = {documentElement:{dataset}, getElementById:id=>['view-home','view-topic-reunion','view-history'].includes(id)};
  for (const [path, expected] of [
    ['/consultation/reunion/','topic-reunion'],
    ['/consultation/reunion','topic-reunion'],
    ['/consultation/reunion/#history','history'],
    ['/#topic-reunion','topic-reunion'],
    ['/#wealth','topic-wealth'],
    ['/#compatibility','relationship-report'],
    ['/','home']
  ]) {
    const context = {document, location:new URL(path,origin)};
    vm.runInNewContext(source,context);
    assert.equal(context.routeAtLocation(),expected,path);
  }
});
