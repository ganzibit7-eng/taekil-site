(() => {
  'use strict';
  const ageKey = 'taekilso_age_confirmed_v1';
  let confirmed = false;
  try {
    sessionStorage.removeItem('taekilso_kakao_access_token');
    confirmed = sessionStorage.getItem(ageKey) === 'yes';
  } catch (_) { /* Storage restrictions only prevent restoring confirmation. */ }

  function confirmAge() {
    const user = window.firebase?.auth()?.currentUser;
    if (user && !user.isAnonymous) return window.TaekilAccountAge.confirmed();
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

  const protectedViews = '.ai-chat-stage, #view-tool, #view-newyear, #view-support, #view-wedding, #view-moving, #view-opening, #view-contract, #view-compat, #view-today';
  function protectInput(event) {
    const field = event.target.closest?.('input, textarea, select');
    if (!field || !field.closest(protectedViews) || field.disabled || field.readOnly) return;
    if (!confirmAge()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      field.blur();
    }
  }
  document.addEventListener('focusin', protectInput, true);
  document.addEventListener('beforeinput', protectInput, true);
  const consentScreen = document.getElementById('aiTransferScreen');
  const profileSettings = document.getElementById('profilePrivacySettings');
  const profileStatus = document.getElementById('profileAIConsentStatus');
  const noticeVersion = '2026-11-19-v1';
  let consentOwner;
  let observedOwner;
  let pendingConsent = null;
  let cancelConsent;
  let statusRequest = 0;
  function currentOwner() { return window.accountStore?.owner() ?? null; }
  function hasAIConsent() { return consentOwner !== undefined && consentOwner === currentOwner(); }
  function forgetAIConsent() { consentOwner = undefined; }
  async function consentRequest(operation,expectedRevision) {
    const token = window.accountStore.snapshot(), owner = currentOwner();
    const headers = await getAiRequestHeaders();
    if (!owner || !headers.Authorization || !window.accountStore.current(token)) throw Error('로그인한 계정을 확인해 주세요.');
    const response = await fetch(AI_CHAT_URL,{
      method:'POST',headers,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',
      signal:AbortSignal.timeout(12000),
      body:JSON.stringify({action:'ai-transfer-consent',operation,noticeVersion,expectedRevision})
    });
    const data = await response.json();
    if (!window.accountStore.current(token)) throw Error('로그인한 계정이 변경됐어요.');
    if (!response.ok) throw Error(data.message || '동의 상태를 처리하지 못했어요.');
    if (data.noticeVersion!==noticeVersion) throw Error('안내가 바뀌었어요. 새로고침해 주세요.');
    return data;
  }
  function applyConsent(data) {
    observedOwner = currentOwner();
    consentOwner = data.state==='granted' ? observedOwner : undefined;
  }
  async function confirmAI(host) {
    if (!host || !consentScreen || !currentOwner()) return false;
    const user = window.firebase?.auth()?.currentUser;
    if (!user || !await window.TaekilAccountAge.ensure(user)) return false;
    if (pendingConsent) return false;
    const owner = currentOwner();
    pendingConsent = true;
    let data;
    try { data = await consentRequest('status'); }
    catch (error) {
      if (owner===currentOwner()) showToast(error.message || '동의 상태를 확인하지 못했어요.');
      return false;
    } finally { pendingConsent = null; }
    if (owner!==currentOwner() || !host.closest('.view')?.classList.contains('visible')) return false;
    applyConsent(data);
    if (data.state==='granted') return true;
    const view = host.closest('.view'), previousFocus = document.activeElement;
    const agree = consentScreen.querySelector('[data-ai-consent="agree"]');
    const saveStatus = document.getElementById('aiConsentSaveStatus');
    let finished = false;
    agree.disabled = false;
    saveStatus.textContent = '';
    pendingConsent = new Promise(resolve => {
      const observer = new MutationObserver(() => {
        if (!view?.classList.contains('visible')) finish(false);
      });
      const onChoice = async event => {
        const choice = event.target.closest('[data-ai-consent]');
        if (!choice || agree.disabled) return;
        if (choice.dataset.aiConsent!=='agree') { finish(false); return; }
        agree.disabled = true;
        saveStatus.textContent = '계정에 동의를 저장하고 있어요.';
        try {
          const updated = await consentRequest('grant',data.revision);
          if (!finished) {
            applyConsent(updated);
            finish(updated.state==='granted');
          }
        } catch (error) {
          if (!finished) saveStatus.textContent = error.message || '저장하지 못했어요. 다시 시도해 주세요.';
        } finally { if (!finished) agree.disabled = false; }
      };
      function finish(selected) {
        if (finished) return;
        finished = true;
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
    const owner = currentOwner();
    if (owner===observedOwner) return;
    observedOwner = owner;
    forgetAIConsent();
    cancelConsent?.();
    refreshProfileConsent();
  });
  function resetAge() {
    forgetAIConsent();
    cancelConsent?.();
    confirmed = false;
    window.TaekilAccountAge.observe(null);
    try { sessionStorage.removeItem(ageKey); } catch (_) {}
  }

  const profileView = document.getElementById('view-profile');
  const grant = document.getElementById('profileGrantAIConsent');
  const withdraw = document.getElementById('profileWithdrawAIConsent');
  const retry = document.getElementById('profileRetryAIConsent');
  function renderProfileConsent(data,message) {
    const labels = {granted:'동의함',withdrawn:'동의 철회됨',not_granted:'미동의',renewal_required:'새 안내 확인 필요'};
    const date = data?.changedAtMs ? new Date(data.changedAtMs).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'short'}) : '';
    profileStatus.textContent = message || labels[data.state] + (date ? ' · '+date+' (한국시간)' : '');
    grant.hidden = !data || data.state==='granted';
    withdraw.hidden = !data || !['granted','renewal_required'].includes(data.state);
    retry.hidden = true;
  }
  async function refreshProfileConsent() {
    const request = ++statusRequest;
    if (!profileView?.classList.contains('visible')) return;
    if (!currentOwner()) { renderProfileConsent(null,'로그인 후 동의 상태를 확인할 수 있어요.'); return; }
    renderProfileConsent(null,'동의 상태를 확인하고 있어요.');
    try {
      const data = await consentRequest('status');
      if (request!==statusRequest) return;
      applyConsent(data);
      renderProfileConsent(data);
    } catch (error) {
      if (request!==statusRequest) return;
      renderProfileConsent(null,error.message || '동의 상태를 불러오지 못했어요.');
      retry.hidden = false;
    }
  }
  if (profileView && profileSettings) {
    new MutationObserver(refreshProfileConsent).observe(profileView,{attributes:true,attributeFilter:['class']});
    grant.addEventListener('click',async () => {
      try { await confirmAI(profileSettings); } finally { await refreshProfileConsent(); }
    });
    retry.addEventListener('click',refreshProfileConsent);
    withdraw.addEventListener('click',async () => {
      ++statusRequest;
      withdraw.disabled = true;
      try {
        const data = await consentRequest('withdraw');
        applyConsent(data);
        renderProfileConsent(data);
        showToast('AI 국외 이전 동의를 철회했어요.');
      } catch (error) { showToast(error.message || '동의 철회가 완료되지 않았어요.'); }
      finally { withdraw.disabled = false; await refreshProfileConsent(); }
    });
    window.addEventListener('focus',refreshProfileConsent);
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
  window.TaekilPrivacy = { confirmAge, confirmAI, hasAIConsent, forgetAIConsent, resetAge };
})();
