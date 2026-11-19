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
  window.TaekilCheckout = { watch, requireOpen, run };
})();
