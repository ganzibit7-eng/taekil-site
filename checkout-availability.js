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

  window.TaekilCheckout = { watch, requireOpen };
})();
