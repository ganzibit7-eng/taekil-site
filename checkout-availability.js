(() => {
  'use strict';

  const root = document.documentElement;
  const pausedMessage = '신규 결제를 잠시 중단했습니다.';

  let database, unsubscribe, checkTimer;
  const checkText = '구매 가능 여부를 확인하고 있어요.';
  const retryText = '구매 가능 여부를 확인하지 못했어요.';

  function state(value) {
    if(value !== 'checking')window.clearTimeout?.(checkTimer);
    for (const name of ['open','paused','unknown']) {
      root.toggleAttribute('data-checkout-' + name, value === name);
    }
  }

  function watch(db) {
    database = db;
    unsubscribe?.();
    state('checking');
    window.clearTimeout?.(checkTimer);
    checkTimer=window.setTimeout?.(()=>state('unknown'),10000);
    unsubscribe = db.collection('siteSettings').doc('checkout').onSnapshot(
      {includeMetadataChanges:true},
      snapshot => {
        const enabled = snapshot.data()?.enabled;
        state(snapshot.metadata.fromCache ? (globalThis.navigator?.onLine === false ? 'unknown' : 'checking')
          : enabled === true ? 'open' : enabled === false ? 'paused' : 'unknown');
      },
      () => state('unknown')
    );
  }

  function statusNote() {
    const note=document.createElement('div');
    note.className='checkout-connection';
    note.innerHTML='<span role="status">'+checkText+'</span><span role="status">'+retryText+'</span><button type="button">다시 확인</button>';
    note.querySelector('button').addEventListener('click',retry);
    return note;
  }
  function retry() {
    if(database)watch(database);
    else location.reload();
  }
  function requireOpen() {
    if (root.hasAttribute('data-checkout-open')) return true;
    showToast(root.hasAttribute('data-checkout-paused') ? pausedMessage :
      root.hasAttribute('data-checkout-unknown') ? retryText : checkText);
    return false;
  }

  let busy = false;
  const lockedButtons = new Set();

  function unlock() {
    busy = false;
    for (const button of lockedButtons) button.disabled = false;
    lockedButtons.clear();
    root.removeAttribute('data-checkout-busy');
  }

  async function run(start) {
    if (busy || !requireOpen()) return;
    busy = true;
    root.setAttribute('data-checkout-busy', '');
    for (const button of document.querySelectorAll('button[data-checkout-action]:not(:disabled)')) {
      lockedButtons.add(button);
      button.disabled = true;
    }
    let handedOff = false;
    try {
      handedOff = await start() === true;
    } finally {
      if (!handedOff) unlock();
    }
  }

  window.addEventListener('pageshow', event => {
    if (event.persisted) unlock();
  });
  let sdkPromise;
  async function loadSdk() {
    if (!requireOpen()) return false;
    if (window.PayApp) return true;
    if (!sdkPromise) sdkPromise = new Promise(resolve => {
      const script = document.createElement('script');
      const finish = ok => { clearTimeout(timer); script.onload = script.onerror = null; if (!ok) script.remove(); resolve(ok); };
      const timer = setTimeout(() => finish(false), 12000);
      script.onload = () => finish(Boolean(window.PayApp));
      script.onerror = () => finish(false);
      script.src = 'https://lite.payapp.kr/public/api/v2/payapp-lite.js';
      document.head.append(script);
    });
    if (!await sdkPromise) { sdkPromise = null; showToast('결제 연결을 준비하지 못했어요. 다시 시도해주세요.'); return false; }
    return requireOpen();
  }
  window.TaekilCheckout = { watch, requireOpen, run, loadSdk, statusNote, retry };
})();
