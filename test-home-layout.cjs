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
    querySelectorAll(selector) { return selector.includes('[data-directory-jump]') ? [button] : []; },
    getElementById(id) { assert.equal(id, headingId); return heading; }
  };
  runInNewContext(entry, { URLSearchParams, location, document });
  assert.deepEqual(calls, [['focus', true], ['scroll', 'start', 'instant']]);
  assert.equal(location.href, 'https://taekilso.com/?utm_source=search');
});

test('the FAQ has a dedicated home link and the ad landing still opens the shared answers inline', () => {
  const html = readFileSync(__dirname + '/index.html', 'utf8');
  const openingTag = html.match(/<details[^>]*\bid="homeFaqFold"[^>]*>/)?.[0];
  assert.ok(openingTag);
  assert.doesNotMatch(openingTag, /\bopen\b/);
  assert.match(html, /<a href="#faq">자주 묻는 질문<\/a>/);
  const faqPage = html.match(/<section id="view-faq"[\s\S]+?<\/section>/)?.[0];
  assert.ok(faqPage);
  assert.equal([...faqPage.matchAll(/class="faq-item"/g)].length,8);
  for (const path of ['/', '/?landing=yeonwoo']) {
    const copied = [];
    const inlineList = {replaceChildren(...items) { copied.push(...items); }, querySelectorAll() { return []; }};
    const faq = {open:false,querySelector() {return inlineList;}};
    const canonical = {children:[{cloneNode() {return 'answer';}}]};
    const document = {
      documentElement: {dataset:{}},
      addEventListener(type, handle) { assert.equal(type, 'DOMContentLoaded'); handle(); },
      querySelectorAll() { return []; },
      getElementById(id) { return id === 'homeFaqFold' ? faq : canonical; }
    };
    runInNewContext(entry, {URLSearchParams, location:new URL(path, 'https://taekilso.com'), document});
    assert.equal(faq.open, path.includes('landing=yeonwoo'));
    assert.equal(copied.length,faq.open ? 1 : 0);
  }
});

test('the directory has a separate new-year section leading to the existing Yeonwoo landing', () => {
  const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const directoryStart = html.indexOf('id="homeDirectory"');
  const adStart = html.indexOf('<div class="block home-first-block"', directoryStart);
  const directory = html.slice(directoryStart, adStart);
  const hero = directory.slice(0, directory.indexOf('<nav'));
  assert.match(hero, /id="directoryHeroTitle"/);
  assert.doesNotMatch(hero, /연우의 AI 사주 상담|연애와 일, 돈과 관계|연우와 상담 시작하기|처음 가입하면 질문 3개 무료/);
  const season = directory.match(/<section class="directory-section" aria-labelledby="directoryNewyearTitle">([\s\S]+?)<\/section>/)?.[1];
  assert.match(season, /2027년 신년상담/);
  assert.match(season, /href="\/\?landing=yeonwoo"/);
  assert.match(html.slice(adStart), /<button class="btn newyear-home-entry" data-open-newyear>2027 신년상담 알아보기<\/button>/);
});

test('the public preview quotes the existing demonstration and opens the existing career topic', () => {
  const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const preview = html.match(/<section class="directory-section directory-preview"[\s\S]+?<\/section>/)?.[0];
  assert.ok(preview);
  const excerpt = preview.match(/<blockquote>([^<]+)<\/blockquote>/)?.[1];
  assert.ok(excerpt);
  assert.ok(html.includes('<div class="ui-real-lead"><p>' + excerpt + '</p>'));
  assert.match(preview, /data-consultation-example="career"/);
  assert.equal([...html.matchAll(/data-consultation-topic="career"/g)].length, 1);
  assert.match(preview, /href="\/\?landing=yeonwoo#uiDemoTitle"/);
  assert.match(html, /id="uiDemoTitle"/);
});

test('new home previews quote recorded answers and hand off to their original specialist topics', () => {
  const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const { examples } = JSON.parse(readFileSync(path.join(__dirname, 'content/home-consultation-previews.json'), 'utf8'));
  assert.deepEqual(examples.map(e => e.topic), ['reunion', 'saving']);
  for (const {topic,advisor,answer} of examples) {
    const panel = html.match(new RegExp('data-preview-panel="' + topic + '" hidden>([\\s\\S]*?)</div>'))?.[1];
    assert.ok(panel, topic);
    assert.ok(panel.includes('<figcaption>' + advisor + '의 답변</figcaption>'));
    const excerpt = panel.match(/<blockquote>([\s\S]+?)<\/blockquote>/)?.[1];
    assert.ok(excerpt);
    const paragraphs = [...excerpt.matchAll(/<p>(.+?)<\/p>/g)].map(match => match[1]);
    assert.ok(paragraphs.length >= 2);
    paragraphs.forEach(text => assert.ok(answer.includes(text), text));
    assert.ok(panel.includes('data-consultation-example="' + topic + '"'));
    assert.equal([...html.matchAll(new RegExp('data-consultation-topic="' + topic + '"','g'))].length, 1);
  }
});

test('the displayed wedding example matches the existing couple scoring and calendar dates', () => {
  const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const part=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
  const score=runInNewContext(
    part('const CHEONGAN =','renderTodayGanji();') +
    part('function scoreDate','const dowNames') +
    part('function buildTaekilCandidate','function getAiInlineTaekilTop') +
    part('function to100','/* ---------- RESULT CARDS') +
    `function getAiChatPrimaryOhaeng(){return ohaengOf(dayGanjiIndex(new Date(1990,0,1)))}
     function getAiChatPartnerOhaeng(){return ohaengOf(dayGanjiIndex(new Date(1992,3,18)))}
     // The deployed lunar calendar returns day 10 and day 11 for these two dates.
     function getLunarInfo(date){return {isSonEomneun:date.getDate()===15}}
     day=>{const row=buildAiInlineCandidate(new Date(2027,4,day),'결혼식');return [to100(row.score),row.ganji,row.ganjiHanja]}`);
  const example=html.match(/<article class="directory-date-example"[\s\S]+?<\/article>/)?.[0];
  assert.ok(example);
  assert.match(example, /data-video-src="assets\/sodam-date-comparison\.mp4"/);
  for (const day of [15,16]) {
    const [value,ganji,hanja]=score(day);
    assert.match(example,new RegExp('datetime="2027-05-'+day+'"[^<]*>[^<]*</time><strong>'+value+'점</strong></dt><dd>'+ganji+'\\('+hanja+'\\)'));
  }
});

test('character cards open introductory views before the existing consultation or date form', () => {
  const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const storyCards = [...html.matchAll(/<a href="#topic-([a-z-]+)"[^>]*data-story-topic="([a-z-]+)"[^>]*>/g)];
  assert.equal(storyCards.length, 21);
  for (const [card, route, topic] of storyCards) {
    assert.equal(route, topic);
    assert.doesNotMatch(card, /data-home-consultation/);
    assert.ok(html.includes('id="view-topic-' + route + '" class="view consultation-story-view"'));
  }
  const weddingCard = html.match(/<a href="#wedding" class="directory-character character-wedding"[^>]*>/)?.[0];
  assert.ok(weddingCard);
  assert.match(weddingCard, /data-story-topic="wedding"/);
  assert.match(weddingCard, /data-consultation-topic="wedding"/);
  assert.doesNotMatch(weddingCard, /data-home-consultation/);
  const wedding = html.slice(html.indexOf('id="view-wedding"'), html.indexOf('id="view-moving"'));
  assert.match(wedding, /id="weddingStoryIntro"/);
  assert.match(wedding, /data-wedding-preview-video/);
  assert.match(wedding, /data-open-date-comparison/);
});

test('consultation cards come before utility cards, and the dates hub retains all calculators', () => {
  const html = readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const section=id=>html.match(new RegExp('aria-labelledby="'+id+'">([\\s\\S]+?)</section>'))?.[1]||'';
  function cards(id) {
    return [...section(id).matchAll(/<(?:a|button)\b[^>]*class="directory-card(?: [^"]*)?"[^>]*>/g)]
      .map(([card])=>card.match(/data-story-topic="([^"]+)"/)?.[1]||card.match(/href="([^"]+)"/)?.[1]||'calculator');
  }
  assert.deepEqual(cards('directoryRelationshipsTitle'),['first-date','reunion','marriage','calculator']);
  assert.deepEqual(cards('directoryDatesTitle'),['move-planning','opening-plan','contract-prep','#date-tools']);
  assert.deepEqual(cards('directoryStudyTitle'),['study-routine','exam-planning','major-choice','new-learning']);
  assert.deepEqual(cards('directoryLifeTitle'),['first-home','family-boundaries','work-rest','friendships']);
  const hub=section('dateToolHubTitle');
  assert.match(hub,/openFortuneModal\(\)/);
  for(const route of ['tool','wedding','moving','opening','contract'])assert.ok(hub.includes('href="#'+route+'"'),route);
});

test('every additional story connects its distinct advisor and choice questions to the existing flow', () => {
  const stories=require('./consultation-additional-stories.js');
  const personas=require('./consultation-personas.js');
  const {normalizeTopic}=require('./consultation-draft-core.js');
  const unique=new Set();
  for(const [topic,story] of Object.entries(stories)){
    const advisor=personas.forTopic(topic);
    assert.equal(normalizeTopic(topic),topic);
    assert.equal(story.feature.media,advisor.id);
    assert.notEqual(advisor.id,'yeonwoo');
    assert.ok(!unique.has(advisor.id));
    unique.add(advisor.id);
    assert.equal(story.feature.chapters.length,3);
    assert.equal(story.feature.choices.length,3);
    assert.deepEqual(advisor.questions,story.feature.choices);
    assert.ok(story.feature.choices.every(([,question])=>question.length<=200));
    assert.ok(readFileSync(path.join(__dirname,story.feature.chapterImage)).length>0);
  }
  assert.equal(unique.size,11);
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
