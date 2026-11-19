(() => {
  'use strict';

  const root = document.documentElement;
  const pausedMessage = '신규 결제를 잠시 중단했습니다.';

  function watch(db) {
    db.collection('siteSettings').doc('checkout').onSnapshot(
      { includeMetadataChanges: true },
      (snapshot) => {
        root.toggleAttribute('data-checkout-open',
          !snapshot.metadata.fromCache && snapshot.data()?.enabled === true);
      },
      () => root.removeAttribute('data-checkout-open')
    );
  }

  function requireOpen() {
    if (root.hasAttribute('data-checkout-open')) return true;
    showToast(pausedMessage);
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
  window.TaekilCheckout = { watch, requireOpen, run, loadSdk };
})();
