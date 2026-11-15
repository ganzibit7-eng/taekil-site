const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const source = readFileSync(__dirname + '/preview-funnel.js', 'utf8');
const now = Date.parse('2026-11-15T00:00:00Z');
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture({ storage = new Map(), send, hostname = 'taekilso.com' } = {}) {
  let time = now;
  let intersect;
  let timerId = 0;
  const events = [];
  const timers = new Map();
  const listeners = new Map();
  const excerpts = Array.from({ length: 3 }, () => ({hidden:false,closest(){return this.hidden ? this : null;}}));
  const window = {
    TaekilCampaign: { emitPreview: async field => {
      events.push(field);
      return send ? send(field) : 'RECORDED';
    }},
    addEventListener: (name, fn) => listeners.set(name, fn),
    IntersectionObserver: true,
  };
  const document = {
    hidden: false,
    querySelectorAll: () => excerpts,
    addEventListener: (name, fn) => listeners.set(name, fn),
  };
  class FakeDate extends Date {
    static now() { return time; }
  }
  runInNewContext(source, {
    window, document, location: { hostname }, Date: FakeDate,
    getKstDateKey: (date = new Date(time)) => new Date(+date + 9 * 3600000).toISOString().slice(0,10),
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    IntersectionObserver: class {
      constructor(callback) { intersect = callback; }
      observe() {}
    },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
  });
  return {
    window, document, events, storage, excerpts,
    intersect: (ratio,index=0) => intersect([{ target:excerpts[index], isIntersecting: ratio > 0, intersectionRatio: ratio }]),
    dispatch: event => listeners.get(event)?.(),
    tick: () => { for(const [id,fn] of [...timers]) { timers.delete(id); fn(); } },
    advance: ms => { time += ms; },
  };
}

test('brief and hidden visits do not count, and a confirmed view is sent once', async () => {
  const f = fixture();
  f.intersect(.55);
  f.intersect(.25);
  f.tick();
  assert.deepEqual(f.events,[]);
  f.document.hidden = true;
  f.intersect(.9);
  f.tick();
  assert.deepEqual(f.events,[]);
  f.document.hidden = false;
  f.dispatch('visibilitychange');
  f.tick();
  await settle();
  f.intersect(0);
  f.intersect(.9);
  f.tick();
  assert.deepEqual(f.events,['previewViews']);
});

test('switching to another example can qualify without counting hidden panels', async () => {
  const f = fixture();
  f.intersect(.8);
  f.excerpts[0].hidden = true;
  f.tick();
  assert.deepEqual(f.events,[]);
  f.intersect(.9,1);
  f.tick();
  await settle();
  f.intersect(.9,2);
  f.tick();
  assert.deepEqual(f.events,['previewViews']);
});

test('the direct preview start qualifies and keeps event order even with a slow request', async () => {
  let release;
  const f = fixture({ send: field => field === 'previewViews' ? new Promise(resolve => { release = resolve; }) : 'RECORDED' });
  f.window.TaekilPreviewFunnel.consultationOpened(true);
  f.dispatch('taekilso:signupCreated');
  assert.deepEqual(f.events,['previewViews']);
  release('RECORDED');
  await settle();
  assert.deepEqual(f.events,['previewViews','previewStarts','previewSignups']);
});

test('the same-tab journey survives a full redirect and a different tab cannot join it', async () => {
  const f = fixture();
  f.window.TaekilPreviewFunnel.consultationOpened(true);
  await settle();
  const differentTab = fixture();
  differentTab.dispatch('taekilso:signupCreated');
  assert.deepEqual(differentTab.events,[]);
  const returned = fixture({ storage: f.storage });
  returned.dispatch('taekilso:signupCreated');
  await settle();
  assert.deepEqual(returned.events,['previewSignups']);
});

test('expired journeys and nonproduction hosts do not send conversions', async () => {
  const f = fixture();
  f.window.TaekilPreviewFunnel.consultationOpened(true);
  await settle();
  f.advance(30 * 60 * 1000);
  f.dispatch('taekilso:signupCreated');
  assert.deepEqual(f.events,['previewViews','previewStarts']);
  const local = fixture({ hostname: 'localhost' });
  assert.equal(local.window.TaekilPreviewFunnel,undefined);
});
