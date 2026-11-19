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
  const consentScreen = document.getElementById('aiTransferScreen');
  let consentOwner;
  let pendingConsent = null;
  let cancelConsent;
  function currentOwner() { return window.accountStore?.owner() ?? null; }
  function hasAIConsent() { return consentOwner !== undefined && consentOwner === currentOwner(); }
  function confirmAI(host) {
    if (!confirmAge()) return false;
    if (hasAIConsent()) return true;
    if (!host || !consentScreen) return false;
    if (pendingConsent) return pendingConsent;
    const owner = currentOwner(), view = host.closest('.view'), previousFocus = document.activeElement;
    pendingConsent = new Promise(resolve => {
      const observer = new MutationObserver(() => {
        if (!view?.classList.contains('visible')) finish(false);
      });
      const onChoice = event => {
        const choice = event.target.closest('[data-ai-consent]');
        if (choice) finish(choice.dataset.aiConsent === 'agree');
      };
      function finish(selected) {
        const agreed = selected && owner===currentOwner() && view?.classList.contains('visible');
        if (agreed) consentOwner = owner;
        observer.disconnect();
        consentScreen.removeEventListener('click',onChoice);
        consentScreen.hidden = true;
        host.removeAttribute('data-awaiting-ai-consent');
        if (!agreed && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
        pendingConsent = null;
        cancelConsent = null;
        resolve(!!agreed);
      }
      cancelConsent = () => finish(false);
      if (view) observer.observe(view,{attributes:true,attributeFilter:['class']});
      consentScreen.addEventListener('click',onChoice);
      host.before(consentScreen);
      host.setAttribute('data-awaiting-ai-consent','');
      consentScreen.hidden = false;
      consentScreen.querySelector('details').open = false;
      consentScreen.querySelector('h2').focus({preventScroll:true});
      consentScreen.scrollIntoView({block:'nearest',behavior:'instant'});
    });
    return pendingConsent;
  }
  window.addEventListener('taekilso:authChanged',() => {
    consentOwner = undefined;
    cancelConsent?.();
  });
  function resetAge() {
    consentOwner = undefined;
    cancelConsent?.();
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
  window.TaekilPrivacy = { confirmAge, confirmSignupAge, confirmAI, hasAIConsent, resetAge };
})();
