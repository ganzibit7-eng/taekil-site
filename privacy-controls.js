(() => {
  'use strict';
  const ageKey = 'taekilso_age_confirmed_v1';
  let confirmed = false;
  try {
    sessionStorage.removeItem('taekilso_kakao_access_token');
    confirmed = sessionStorage.getItem(ageKey) === 'yes';
  } catch (_) { /* Storage restrictions only prevent restoring confirmation. */ }

  function confirmAge() {
    if (confirmed) return true;
    return rememberAge(window.confirm('이용하시는 본인이 만 14세 이상인가요?'));
  }

  function rememberAge(value) {
    confirmed = value;
    if (confirmed) {
      try { sessionStorage.setItem(ageKey, 'yes'); } catch (_) {}
    }
    return confirmed;
  }

  const ageCheckbox = document.getElementById('authAgeConfirmed');
  if (ageCheckbox) ageCheckbox.checked = confirmed;
  function confirmSignupAge() {
    if (ageCheckbox?.checked) return rememberAge(true);
    ageCheckbox?.focus();
    return false;
  }

  const protectedViews = '.ai-chat-stage, #view-tool, #view-newyear, #view-support, #view-wedding, #view-moving, #view-opening, #view-contract, #view-compat, #view-today';
  function protectInput(event) {
    const field = event.target.closest?.('input, textarea, select');
    if (!field || !field.closest(protectedViews) || field.disabled || field.readOnly || confirmed) return;
    if (!confirmAge()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      field.blur();
    }
  }
  document.addEventListener('focusin', protectInput, true);
  document.addEventListener('beforeinput', protectInput, true);
  const consentDialog = document.getElementById('aiTransferDialog');
  let consentOwner;
  let pendingConsent = null;
  function confirmAI() {
    if (!confirmAge()) return false;
    const owner = window.accountStore?.owner() ?? null;
    if (consentOwner === owner) return true;
    if (!consentDialog?.showModal) return false;
    if (pendingConsent) return pendingConsent;
    pendingConsent = new Promise(resolve => {
      consentDialog.returnValue = '';
      consentDialog.addEventListener('close', () => {
        const agreed = consentDialog.returnValue === 'agree' && (window.accountStore?.owner() ?? null) === owner;
        if (agreed) consentOwner = owner;
        pendingConsent = null;
        resolve(agreed);
      }, {once:true});
      consentDialog.showModal();
    });
    return pendingConsent;
  }
  function resetAge() {
    consentOwner = undefined;
    if (consentDialog?.open) consentDialog.close('cancel');
    confirmed = false;
    if (ageCheckbox) ageCheckbox.checked = false;
    try { sessionStorage.removeItem(ageKey); } catch (_) {}
  }

  if (new URLSearchParams(location.search).get('privacy') === 'ai' && location.hash === '#legal') {
    const legal = document.getElementById('view-legal');
    const showSection = () => {
      if (!legal?.classList.contains('visible')) return false;
      const scrollToPolicy = () => requestAnimationFrame(() => {
        if (legal.classList.contains('visible')) {
          document.getElementById('ai-transfer-policy')?.scrollIntoView({block:'start',behavior:'instant'});
        }
      });
      scrollToPolicy();
      const afterLayout = () => { document.fonts.ready.then(scrollToPolicy); };
      if (document.readyState === 'complete') afterLayout();
      else window.addEventListener('load', afterLayout, {once:true});
      return true;
    };
    if (legal && !showSection()) {
      const observer = new MutationObserver(() => { if (showSection()) observer.disconnect(); });
      observer.observe(legal,{attributes:true,attributeFilter:['class']});
    }
  }
  window.TaekilPrivacy = { confirmAge, confirmSignupAge, confirmAI, resetAge };
})();
