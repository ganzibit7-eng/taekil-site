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
    TaekilMetricsPreference: { enabled:()=>true }, TaekilCampaign: { activity: async field => {
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
  assert.deepEqual(f.events,['exampleReads']);
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
  assert.deepEqual(f.events,['exampleReads']);
});

test('opening a consultation without reading counts independently and signup emits no preview event',()=>{
 const f=fixture();
 f.window.TaekilPreviewFunnel.consultationOpened();
 f.dispatch('taekilso:signupCreated');
 f.window.TaekilPreviewFunnel.consultationOpened();
 assert.deepEqual(f.events,['consultationOpens','consultationOpens']);
 assert.equal(f.storage.size,0);
});
test('nonproduction hosts do not collect views',()=>{
 assert.equal(fixture({hostname:'localhost'}).window.TaekilPreviewFunnel,undefined);
});
