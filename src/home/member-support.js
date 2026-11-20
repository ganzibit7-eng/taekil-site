/* ---------- 고객센터 (1:1 문의) ---------- */
const SUPPORT_LIST_KEY = 'taekilso_my_inquiries';

function getMyInquiryList() {
  try { return JSON.parse(accountStore.getItem(SUPPORT_LIST_KEY) || '[]'); }
  catch (e) { return []; }
}


function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function saveLocalInquiryRef(id, title) {
  const list = getMyInquiryList().filter(x => x.id !== id);
  list.unshift({
    id,
    title,
    createdAt: Date.now()
  });
  accountStore.setItem(SUPPORT_LIST_KEY, JSON.stringify(list));
}

function showSupportStatus(msg, kind) {
  const el = document.getElementById('supportStatus');
  if (!el) return;
  el.style.display = 'block';
  el.textContent = msg;
  if (kind === 'error') { el.style.background = 'rgba(201,131,106,.15)'; el.style.color = 'var(--warn)'; el.style.border = '1px solid rgba(201,131,106,.3)'; }
  else if (kind === 'success') { el.style.background = 'rgba(215,180,106,.12)'; el.style.color = 'var(--gold-hi)'; el.style.border = '1px solid rgba(215,180,106,.3)'; }
  else { el.style.background = 'rgba(255,255,255,.05)'; el.style.color = 'var(--muted)'; el.style.border = '1px solid var(--line-soft)'; }
}

async function submitInquiry(prefill) {
  const button = document.getElementById('supportSubmit');
  if (button.disabled) return;
  button.disabled = true;
  const token = accountStore.snapshot();
  try {
    await registerSupportInquiry(prefill);
  } catch {
    if (accountStore.current(token)) showSupportStatus('문의를 접수하지 못했어요. 연결을 확인하고 다시 시도해 주세요.', 'error');
  } finally {
    if (accountStore.current(token)) button.disabled = false;
  }
}

async function registerSupportInquiry(prefill) {
  const accountToken = accountStore.snapshot();
  showSupportStatus('확인 중이에요…', 'info');

  const kakaoUser = getKakaoUser();
  const currentFbUser = (firebaseReady && firebase.auth) ? firebase.auth().currentUser : null;
  if (!kakaoUser && !currentFbUser) {
    showSupportStatus('로그인 후 문의를 남길 수 있어요. 위의 "로그인" 버튼을 먼저 눌러주세요.', 'error');
    openAuthModal();
    return;
  }

  const inquiryType = document.getElementById('supportType')?.value;
  if (!['general','dispute'].includes(inquiryType)) { showSupportStatus('문의 종류를 선택해주세요.', 'error'); return; }
  const titleEl = document.getElementById('supportTitle');
  const messageEl = document.getElementById('supportMessage');
  const title = (titleEl?.value || '').trim();
  const message = (messageEl?.value || '').trim();

  if (!title || !message) {
    showSupportStatus('제목과 내용을 모두 입력해주세요.', 'error');
    return;
  }
  if (title.length > 120) {
    showSupportStatus('문의 제목은 120자 이내로 적어주세요.', 'error');
    return;
  }
  if (message.length > 5000) {
    showSupportStatus('문의 내용은 5,000자 이내로 적어주세요.', 'error');
    return;
  }

  const authUser = await ensureFirestorePaymentAuth();
  if (!accountStore.current(accountToken)) return;
  if (!authUser || authUser.isAnonymous) {
    showSupportStatus('로그인 보안 연결을 확인하지 못했어요. 로그아웃 후 다시 로그인한 뒤 문의해주세요.', 'error');
    return;
  }

  if (!accountStore.current(accountToken) || authUser.uid !== accountToken.owner) return;
  const ownerUid = authUser.uid;
  const name = kakaoUser
    ? (kakaoUser.nickname || '카카오 사용자')
    : (authUser.displayName || authUser.email || '회원');

  const payload = {
    uid: ownerUid,
    ownerUid,
    firebaseUid: ownerUid,
    name,
    title,
    message,
    status: '대기',
    reply: '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdAtMs: Date.now(),
    source: inquiryType + '-' + (kakaoUser ? 'kakao' : 'firebase')
  };

  const timeoutId = setTimeout(() => {
    if (!accountStore.current(accountToken)) return;
    showSupportStatus('아직 접수 중이에요. 인터넷에 연결되면 접수 결과를 알려드려요.', 'info');
  }, 10000);

  try {
    if (!db) throw new Error('FIRESTORE_NOT_READY');

    showSupportStatus('등록하는 중이에요…', 'info');
    const docRef = await db.collection('inquiries').add(payload);
    clearTimeout(timeoutId);

    if (!accountStore.current(accountToken)) return;

    saveLocalInquiryRef(docRef.id, title);
    clearInquiryForm(prefill);
    showSupportStatus('✓ 문의가 정상적으로 등록됐어요. 아래 내 문의 내역에서 확인할 수 있어요.', 'success');
    showToast('문의가 등록됐어요.');
    renderSupportList();

  } catch (err) {
    clearTimeout(timeoutId);
    if (!accountStore.current(accountToken)) return;
    console.error('문의 저장 실패', err);
    showSupportStatus('문의를 등록하지 못했어요. 입력 내용은 남아 있으니 다시 시도해 주세요.', 'error');
  }
}

function clearInquiryForm(prefill) {
  const titleEl = document.getElementById('supportTitle');
  const messageEl = document.getElementById('supportMessage');
  if (titleEl) titleEl.value = '';
  if (!prefill && messageEl) messageEl.value = '';
}

function getInquiryOwnerUid() {
  const fbUser = (firebaseReady && firebaseAuthReady && firebaseAuthUser) ? firebaseAuthUser : null;
  if (fbUser) return fbUser.uid;
  return null;
}

function renderSupportList() {
  const listEl = document.getElementById('supportList');
  const emptyEl = document.getElementById('supportEmpty');
  document.getElementById('supportDetail').style.display = 'none';
  const mine = getMyInquiryList();
  if (!mine.length) { listEl.innerHTML = ''; emptyEl.style.display = 'block'; return; }
  emptyEl.style.display = 'none';
  listEl.replaceChildren();
  for (const item of mine) {
    const row = document.createElement('div');
    row.className = 'usecase-item inq-item';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'inquiry-open';
    const title = document.createElement('span');
    title.textContent = item.title || '(제목 없음)';
    const badge = document.createElement('span');
    badge.className = 'inq-status ' + (item.answered ? 'answered' : 'waiting');
    badge.textContent = item.localOnly ? '임시 저장' : item.answered ? '답변 완료' : item.answered === false ? '답변 대기' : '확인 중';
    open.append(title, badge);
    open.onclick = () => showInquiryDetail(item.id);
    row.append(open);
    if (!item.answered && (item.canCancel || item.localOnly) && !isRefundRequestTitle(item.title)) {
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'inquiry-cancel';
      cancel.textContent = '취소';
      cancel.onclick = () => cancelInquiry(item.id);
      row.append(cancel);
    }
    listEl.append(row);
  }
}

/* 환불 요청 문의인지 판별합니다. requestRefund()에서 등록하는 문의 제목과 동일합니다. */
function isRefundRequestTitle(title) {
  return (title || '').trim() === '프리미엄 결제 환불 요청';
}

/* 답변이 등록되기 전까지는 본인이 등록한 문의를 스스로 취소(삭제)할 수 있습니다.
   단, 환불 요청 문의는 등록 후 스스로 취소(증거 삭제)할 수 없도록 막습니다. */
function cancelInquiry(id) {
  const accountToken = accountStore.snapshot();
  if (!confirm('이 문의를 취소할까요? 취소하면 되돌릴 수 없어요.')) return;

  const removeLocally = () => {
    if (!accountStore.current(accountToken)) return;
    const list = getMyInquiryList().filter(x => x.id !== id);
    accountStore.setItem(SUPPORT_LIST_KEY, JSON.stringify(list));
    showToast('문의를 취소했어요.');
    renderSupportList();
  };

  const local = getMyInquiryList().find(x => x.id === id);
  if (local && isRefundRequestTitle(local.title)) {
    showToast('환불 요청 문의는 취소할 수 없어요. 고객센터로 문의해주세요.');
    return;
  }
  if (local && local.localOnly) { removeLocally(); return; } // 서버에 올라간 적 없는 임시 항목은 로컬에서만 지우면 됩니다.
  if (!db) { showToast('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.'); return; }

  db.collection('inquiries').doc(id).get().then((snap) => {
    if (!snap.exists) return;
    const data = snap.data();
    if (!accountStore.current(accountToken) || data.ownerUid !== accountToken.owner) return;
    if (isRefundRequestTitle(data.title) || ['dispute-kakao','dispute-firebase'].includes(data.source) || data.legalHold === true) {
      showToast('환불 요청 문의는 취소할 수 없어요. 고객센터로 문의해주세요.');
      return;
    }
    if (data.status === '답변완료') {
      showToast('이미 답변이 등록된 문의는 취소할 수 없어요.');
      return;
    }
    return db.collection('inquiries').doc(id).delete().then(removeLocally);
  }).catch(err => showToast('취소 실패: ' + err.message));
}

function showInquiryDetail(id) {
  const accountToken = accountStore.snapshot();
  const panel = document.getElementById('supportDetail');
  panel.dataset.inquiryId = id;
  const local = getMyInquiryList().find(x => x.id === id);
  if (local && local.localOnly) {
    panel.style.display = 'block';
    panel.innerHTML = `<div class="pr-tag">임시 저장</div><div style="font-family:var(--serif);font-size:18px;margin-bottom:8px;">${escapeHtml(local.title)}</div><div style="font-size:13.5px;color:#cfcbc1;white-space:pre-wrap;">${escapeHtml(local.message || '')}</div><div style="font-size:12px;color:var(--muted);margin-top:14px;">서버 연결이 복구되면 문의 등록을 다시 눌러주세요.</div>`;
    return;
  }
  if (!db) return;
  panel.style.display = 'block';
  panel.innerHTML = '<div class="loading-line" style="margin-top:0;">불러오는 중…</div>';
  db.collection('inquiries').doc(id).get().then((snap) => {
    if (!accountStore.current(accountToken) || panel.dataset.inquiryId !== id) return;
    if (!snap.exists) { panel.innerHTML = '<div class="empty-note">문의를 찾을 수 없어요.</div>'; return; }
    const q = snap.data();
    const ownerUid = getInquiryOwnerUid();
    if (!ownerUid || q.ownerUid !== ownerUid) {
      panel.innerHTML = '<div class="empty-note">이 문의를 볼 권한이 없어요.</div>';
      return;
    }
    panel.innerHTML = `
      <div class="pr-tag">${q.status === '답변완료' ? '답변 완료' : '답변 대기'}</div>
      <div style="font-family:var(--serif); font-size:18px; margin-bottom:8px;">${escapeHtml(q.title)}</div>
      <div style="font-size:13.5px; color:#cfcbc1; white-space:pre-wrap; margin-bottom:14px;">${escapeHtml(q.message || '')}</div>
      ${q.reply ? `<div style="border-top:1px solid var(--line-soft); padding-top:14px;"><div style="font-size:11px; color:var(--gold-hi); margin-bottom:6px;">택일소 답변</div><div style="font-size:13.5px; color:#e8e5dc; white-space:pre-wrap;">${escapeHtml(q.reply)}</div></div>` : `<div style="font-size:12.5px; color:var(--muted);">아직 답변 전이에요. 조금만 기다려주세요.</div>`}
    `;
  }).catch(err => { if (!accountStore.current(accountToken) || panel.dataset.inquiryId !== id) return; panel.innerHTML = '<div class="empty-note">불러오지 못했어요.</div>'; console.error(err); });
}

/* ---------- 회원탈퇴 (본인 계정만) ---------- */
/* ---------- 환불 요청 (프로필 → 자동으로 1:1 문의 등록) ---------- */
/* 자주 있는 결제 문의를 빠르게 선택하면, 제목과 함께 진단에 도움 되는 정보를
   자동으로 채워줍니다. 손님이 상황을 길게 설명 안 해도 되도록 돕는 용도입니다. */
function fillCommonInquiry(kind) {
  const loggedIn = getKakaoUser() || (firebaseReady && firebaseAuthReady && firebaseAuthUser);
  if (!loggedIn) { showToast('로그인 후 이용할 수 있어요.'); openAuthModal(); return; }

  const orderId = accountStore.getItem('taekilso_last_order_id') || '(기록 없음)';
  const purchasedAtMs = Number(accountStore.getItem('taekilso_last_purchase_at')) || 0;
  const purchasedAtStr = purchasedAtMs ? new Date(purchasedAtMs).toLocaleString('ko-KR') : '(기록 없음)';
  const premiumNow = isPremium() ? '프리미엄 이용 중' : '프리미엄 아님';

  const templates = {
    paymentFailed: {
      title: '결제가 안 됐어요',
      message: '프리미엄 결제를 진행했는데 결제가 정상적으로 되지 않았어요.\n\n' +
        '언제 시도하셨는지, 어떤 화면/메시지가 떴는지 알려주시면 빠르게 확인할 수 있어요:\n(자세한 상황을 여기에 적어주세요)\n\n' +
        '── 자동 기록 ──\n' +
        `현재 계정 상태: ${premiumNow}\n` +
        `마지막 주문번호: ${orderId}`
    },
    premiumNotOpen: {
      title: '결제했는데 프리미엄이 안 열려요',
      message: '결제는 완료됐는데 프리미엄 기능이 아직 열리지 않았어요.\n\n' +
        '결제하신 카드/은행에서 실제로 출금됐는지도 함께 확인 부탁드려요.\n\n' +
        '── 자동 기록 ──\n' +
        `현재 계정 상태: ${premiumNow}\n` +
        `마지막 주문번호: ${orderId}\n` +
        `결제(활성화) 시각: ${purchasedAtStr}`
    }
  };
  const t = templates[kind];
  if (!t) return;
  document.getElementById('supportType').value = 'dispute';
  document.getElementById('supportTitle').value = t.title;
  document.getElementById('supportMessage').value = t.message;
  document.getElementById('supportMessage').focus();
}

async function requestRefund() {
  const accountToken = accountStore.snapshot();
  const loggedIn = getKakaoUser() || (firebaseReady && firebaseAuthReady && firebaseAuthUser);
  if (!loggedIn) { showToast('로그인 후 이용할 수 있어요.'); openAuthModal(); return; }
  if (!isPremium()) { showToast('프리미엄 결제 내역이 없어요.'); return; }

  const until = getPremiumUntil();
  const purchasedAtMs = Number(accountStore.getItem('taekilso_last_purchase_at')) || (until ? until - PREMIUM_DURATION_MS : 0);
  const orderId = accountStore.getItem('taekilso_last_order_id') || '(기록 없음)';
  const purchasedAtStr = purchasedAtMs ? new Date(purchasedAtMs).toLocaleString('ko-KR') : '(기록 없음)';

  // 이용 횟수는 이제 브라우저 기록이 아니라 서버(Firestore)에 저장된 값을 직접 확인합니다.
  // 이 값은 본인이 늘릴 수만 있고(그것도 한 번에 1씩만) 줄이거나 마음대로 바꿀 수 없게
  // Firestore 규칙으로 막아뒀기 때문에, 실제로 이용한 횟수를 신뢰할 수 있습니다.
  const uid = getCurrentUserKey();
  let usedCount = null;
  if (db && uid) {
    try {
      const snap = await db.collection('users').doc(uid).get({ source: 'server' });
      usedCount = (snap.exists && typeof snap.data().premiumUsageCount === 'number') ? snap.data().premiumUsageCount : null;
    } catch (e) {
      console.error('이용 횟수 확인 실패', e);
    }
  }

  if (!accountStore.current(accountToken)) return;
  goTo('support');
  document.dispatchEvent(new CustomEvent('taekilso:openWebInquiry'));
  setTimeout(() => {
    if (!accountStore.current(accountToken)) return;
    document.getElementById('supportType').value = 'dispute';
    document.getElementById('supportTitle').value = '프리미엄 결제 환불 요청';
    document.getElementById('supportMessage').value =
      '프리미엄(8,900원) 결제에 대한 환불을 요청합니다.\n\n' +
      '환불 사유: \n(자세한 사유를 여기에 적어주세요)\n\n' +
      '── 문의 확인을 위한 참고 정보 ──\n' +
      `주문번호: ${orderId}\n` +
      `결제(활성화) 시각: ${purchasedAtStr}\n` +
      `이용 만료 예정일: ${until ? new Date(until).toLocaleString('ko-KR') : '(기록 없음)'}\n` +
      `기록된 프리미엄 기능 이용 횟수: ${usedCount == null ? '확인 필요' : usedCount + '회'}\n실제 결제와 상담·리포트 이용 내역은 접수 후 확인해 주세요.`;
    document.getElementById('supportMessage').focus({ preventScroll: true });
    showToast('환불 사유를 작성한 뒤 문의 등록을 눌러 주세요.');
  }, 100);
}

async function confirmDeleteAccount() {
  const paymentUser = window.firebase?.auth().currentUser;
  if (!paymentUser || paymentUser.isAnonymous) {
    showToast('로그인 보안 연결을 확인하지 못했어요. 다시 로그인한 뒤 시도해주세요.');
    return;
  }
  if (!confirm('계정을 삭제하면 30일 동안 같은 계정으로 다시 가입할 수 없어요. 정말 탈퇴할까요?')) return;

  try {
    if (paymentUser.uid.startsWith('kakao_')) {
      if (!kakaoReady || location.origin !== 'https://taekilso.com') throw Error('택일소 공식 홈페이지에서 카카오 재인증을 시작해주세요.');
      const state = createKakaoLoginState();
      sessionStorage.setItem('taekilso_delete_intent', JSON.stringify({state, uid:paymentUser.uid}));
      Kakao.Auth.authorize({redirectUri:'https://taekilso.com/', scope:'profile_nickname', prompt:'login', state});
      return;
    }
    await paymentUser.reauthenticateWithPopup(getGoogleProvider());
    await finishAccountDeletion(paymentUser);
  } catch (_) {
    showToast('본인 확인을 완료하지 못했어요. 회원정보는 그대로예요.');
  }
}

async function finishAccountDeletion(paymentUser, kakaoCode) {
  try {
    const auth = 'Bearer ' + await paymentUser.getIdToken(true);
    if (paymentUser.uid !== accountStore.owner()) return;
    const res = await fetch(MEMBER_SELF_DELETE_URL, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true, kakaoCode }),
      cache: 'no-store'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || '회원탈퇴를 완료하지 못했어요.');
    window.clearDeletedAccountCache?.(paymentUser.uid);
    if (paymentUser.uid !== accountStore.owner()) return;

    localStorage.removeItem(KAKAO_USER_KEY);
    sessionStorage.removeItem(KAKAO_USER_KEY);
    sessionStorage.removeItem('taekilso_kakao_access_token');
    clearLocalPremium();
    try { await firebase.auth().signOut(); } catch (e) {}
    firebaseAuthUser = null;
    updateAuthNav();
    updatePremiumUI();
    showToast('회원탈퇴가 완료됐어요. 30일 동안 재가입이 제한됩니다.');
    goTo('home');
  } catch (err) {
    console.error('회원탈퇴 실패', err);
    showToast(err.message || '회원탈퇴에 실패했어요. 잠시 후 다시 시도해주세요.');
  }
}

let cachedGoogleProvider = null;
function getGoogleProvider(){
  if (cachedGoogleProvider) return cachedGoogleProvider;
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  cachedGoogleProvider = provider;
  return provider;
}

async function loginWithGoogle() {
  const ageIntent = window.TaekilAccountAge.entry();
  if (!ageIntent) return;
  if (!firebaseReady || !window.firebase || !firebase.auth) {
    document.getElementById('authSetupNotice').style.display = 'block';
    showAuthError('Firebase Authentication이 연결되지 않았어요. firebaseConfig와 Authentication 설정을 확인해주세요.');
    return;
  }

  const btn = document.querySelector('#authOverlay button[onclick="loginWithGoogle()"]');
  if (btn) {
    btn.disabled = true;
    btn.querySelector('[data-provider-label]').textContent = 'Google 연결 중…';
  }

  try {
    if (firebaseAuthInitPromise) await firebaseAuthInitPromise;

    try { localStorage.removeItem(KAKAO_USER_KEY); } catch(e) {}
    try { sessionStorage.removeItem(KAKAO_USER_KEY); } catch(e) {}
    try { sessionStorage.removeItem('taekilso_kakao_access_token'); } catch(e) {}

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt:'select_account' });

    const result = await window.TaekilAccountAge.connect(() => firebase.auth().signInWithPopup(provider), ageIntent);

    if (!result || !result.user) {
      throw new Error('Google 로그인 결과를 확인하지 못했어요.');
    }

    const allowed = await checkMemberAccess(result.user, { strict:true });
    if (!allowed) return;

    if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
      await recordSignup(result.user.uid, {
        email: result.user.email,
        provider:'google'
      });
    } else {
      ensureMemberDocumentFromAuth(result.user);
    }

    closeAuthModal();
    showToast('Google 계정으로 로그인했어요.');
    continueHomeChatAfterLogin();

  } catch (err) {
    console.warn('Google popup 로그인 실패', err);

    const code = String(err && err.code || '');

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      showAuthError('Google 로그인 창이 닫혔어요. 다시 눌러 로그인해주세요.');
    } else if (code === 'auth/popup-blocked') {
      showAuthError('브라우저가 Google 로그인 팝업을 막았어요. 주소창의 팝업 차단을 허용한 뒤 다시 눌러주세요.');
    } else if (code === 'auth/operation-not-supported-in-this-environment') {
      showAuthError('현재 브라우저에서는 Google 팝업 로그인을 사용할 수 없어요. Chrome 또는 Safari 일반 탭에서 다시 시도해주세요.');
    } else {
      showAuthError('Google 로그인 실패: ' + formatAuthError(err));
    }

  } finally {
    if (btn) {
      btn.disabled = false;
      btn.querySelector('[data-provider-label]').textContent = 'Google로 시작하기';
      window.TaekilAccountAge.sync();
    }
  }
}

/* Kakao SDK v2 dropped popup login; the only client method is a full-page
   redirect (authorize) that sends the browser to Kakao and back with a
   ?code= param, which we then exchange for a token below. */

async function ensureKakaoFirebaseSession(accessToken, ageIntent = 'login') {
  if (!firebaseReady || !window.firebase || !firebase.auth || !KAKAO_TOKEN_FUNCTION_URL) return null;

  const token = accessToken;
  if (!token) return null;

  // 카카오 로그인을 시작한 경우 기존 Google Firebase 세션을 재사용하지 않습니다.
  // 서버가 검증한 카카오 계정의 customToken으로 반드시 세션을 교체해야
  // 카카오 프로필과 다른 Firebase UID가 섞이지 않습니다.

  try {
    const bridgeRes = await fetch(KAKAO_TOKEN_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token })
    });
    const bridgeData = await bridgeRes.json().catch(() => ({}));
    if (bridgeRes.status === 403 && (bridgeData.error === 'ACCOUNT_BANNED' || bridgeData.error === 'ACCOUNT_REJOIN_COOLDOWN')) {
      let message = bridgeData.message || '이 계정은 현재 이용할 수 없습니다.';
      if (bridgeData.error === 'ACCOUNT_REJOIN_COOLDOWN' && bridgeData.rejoinAllowedAtMs) {
        message += ' 재가입 가능일: ' + new Date(Number(bridgeData.rejoinAllowedAtMs)).toLocaleDateString('ko-KR');
      }
      const bannedErr = new Error(message);
      bannedErr.code = bridgeData.error;
      throw bannedErr;
    }
    if (!bridgeRes.ok || !bridgeData.customToken) {
      console.warn('카카오→Firebase 연결 실패', bridgeData);
      return null;
    }

    const credential = await window.TaekilAccountAge.connect(() => firebase.auth().signInWithCustomToken(bridgeData.customToken), ageIntent);
    firebaseAuthUser = credential.user || firebase.auth().currentUser || null;
    firebaseAuthReady = true;
    return firebaseAuthUser;
  } catch (err) {
    console.warn('카카오→Firebase 연결 중 오류', err);
    if (err && (err.code === 'ACCOUNT_BANNED' || err.code === 'ACCOUNT_REJOIN_COOLDOWN')) throw err;
    return null;
  }
}

async function ensureFirestorePaymentAuth() {
  if (!firebaseReady || !window.firebase || !firebase.auth) return null;

  await waitForAuthSettled(4000).catch(() => {});

  let current = firebase.auth().currentUser;
  if (current && !current.isAnonymous) {
    const allowed = await checkMemberAccess(current, { strict:true });
    if (!allowed) return null;
    firebaseAuthUser = current;
    firebaseAuthReady = true;
    return current;
  }

  if (getKakaoUser()) {
    try {
      current = await ensureKakaoFirebaseSession();
    } catch (err) {
      if (err && (err.code === 'ACCOUNT_BANNED' || err.code === 'ACCOUNT_REJOIN_COOLDOWN')) {
        clearLocalKakaoSessionForBan();
        showToast(err.message);
        return null;
      }
      throw err;
    }
    if (current && !current.isAnonymous) {
      const allowed = await checkMemberAccess(current, { strict:true });
      if (!allowed) return null;
      return current;
    }
  }

  return null;
}

async function getAiRequestHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const current = firebaseReady && window.firebase && firebase.auth
      ? firebase.auth().currentUser
      : null;

    if (current && !current.isAnonymous) {
      const allowed = await checkMemberAccess(current, { strict:true });
      if (!allowed) return headers;
      headers.Authorization = 'Bearer ' + await current.getIdToken();
      return headers;
    }
  } catch (err) {
    console.warn('Firebase ID 토큰 준비 실패', err);
  }

  return headers; // Firebase verifies the existing member session.
}

function createKakaoLoginState() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const state = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem('taekilso_kakao_login_state', JSON.stringify({state, createdAt:Date.now()}));
  return state;
}

function consumeKakaoLoginState(state) {
  try {
    const raw = sessionStorage.getItem('taekilso_kakao_login_state');
    sessionStorage.removeItem('taekilso_kakao_login_state');
    const pending = JSON.parse(raw || 'null');
    const age = Date.now() - Number(pending?.createdAt);
    return typeof state === 'string' && /^[a-f0-9]{64}$/.test(state)
      && pending?.state === state && Number.isFinite(age) && age >= 0 && age <= 10 * 60 * 1000;
  } catch (_) { return false; }
}

async function loginWithKakao() {
  const ageIntent = window.TaekilAccountAge.entry();
  if (!ageIntent) return;
  if (!kakaoReady) {
    showToast('카카오 로그인 설정이 아직 안 됐어요.');
    return;
  }
  if (firebaseReady && firebaseAuthUser && !firebaseAuthUser.isAnonymous) {
    try { await firebase.auth().signOut(); } catch (e) {}
  }
  try {
    const state = createKakaoLoginState();
    window.TaekilAccountAge.rememberRedirect(state, ageIntent);
    Kakao.Auth.authorize({ redirectUri: KAKAO_REDIRECT_URI, scope: 'profile_nickname', state });
  } catch (_) { showToast('로그인 보안 정보를 저장하지 못했어요. 브라우저 저장 설정을 확인하고 다시 시도해주세요.'); }
}

async function exchangeKakaoCode(code, state) {
  const validState = consumeKakaoLoginState(state);
  const deletion = sessionStorage.getItem('taekilso_delete_intent');
  sessionStorage.removeItem('taekilso_delete_intent');
  const callbackUrl = new URL(window.location.href);
  for (const key of ['code', 'state', 'error', 'error_description']) callbackUrl.searchParams.delete(key);
  window.history.replaceState({}, document.title, callbackUrl.toString());
  if (!validState) { showToast('로그인 요청이 만료되었거나 일치하지 않아요. 카카오 로그인 버튼으로 다시 시작해주세요.'); return; }
  try {
    if (deletion) {
      const intent = JSON.parse(deletion);
      if (intent.state === state) {
        const user = await ensureFirestorePaymentAuth();
        if (!user || user.uid !== intent.uid) { showToast('로그인한 계정을 다시 확인해주세요.'); return; }
        if (confirm('본인 확인을 마쳤어요. 지금 회원탈퇴를 완료할까요?')) await finishAccountDeletion(user, code);
        return;
      }
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      code: code,
      state: state
    });

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: body.toString()
    });

    let tokenData;
    try {
      tokenData = await tokenRes.json();
    } catch (parseErr) {
      throw new Error('카카오 응답을 읽지 못했어요 (HTTP ' + tokenRes.status + ')');
    }

    if (!tokenData.access_token) {
      throw new Error((tokenData.error || '오류') + ': ' + (tokenData.error_description || '토큰 발급 실패'));
    }

    const kakaoBridgePromise = ensureKakaoFirebaseSession(tokenData.access_token, window.TaekilAccountAge.takeRedirect(state));
    const meRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: 'Bearer ' + tokenData.access_token }
    });
    const me = await meRes.json();
    if (!me || !me.id) throw new Error('카카오 사용자 정보를 확인하지 못했어요.');

    const account = me.kakao_account || {};
    const profile = {
      id: me.id,
      nickname: (account.profile && account.profile.nickname) || '카카오 사용자',
      email: account.email || null
    };

    // 먼저 서버에서 Kakao 계정의 밴 여부를 확인하고 Firebase 보안 세션을 만듭니다.
    // 밴 계정은 로컬 로그인 상태조차 저장하지 않습니다.
    const bridgedUser = await kakaoBridgePromise;
    if (!bridgedUser || bridgedUser.isAnonymous) throw new Error('카카오 로그인 보안 연결을 완료하지 못했어요.');
    const firestoreUid = bridgedUser.uid;

    if (!firestoreUid) {
      throw new Error('카카오 로그인 보안 연결을 완료하지 못했어요.');
    }

    const allowed = await checkMemberAccess(bridgedUser, { strict:true });
    if (!allowed) return;

    localStorage.setItem(KAKAO_USER_KEY, JSON.stringify(profile));
    sessionStorage.setItem(KAKAO_USER_KEY, JSON.stringify(profile));
    // Only Firebase maintains the signed-in session after the token exchange.

    updateAuthNav();
    showToast('카카오로 로그인했어요');
    continueHomeChatAfterLogin();

    if (db && firestoreUid) {
      await recordSignup(firestoreUid, {
        email: profile.email || null,
        nickname: profile.nickname,
        provider: 'kakao'
      });

      // 카카오 로그인 직후에는 onAuthStateChanged 타이밍에 기대지 않고
      // 해당 kakao_UID의 최근 접속시간을 즉시 기록합니다.
      await touchMemberLastSeen(bridgedUser, { force:true });

      reconcilePremiumWithAccount(firestoreUid);
      flushLocalOnlyInquiries();
    } else {
      console.warn('카카오 로그인은 완료됐지만 Firebase 보안 세션이 준비되지 않았습니다.');
    }
  } catch (err) {
    console.error('카카오 로그인 처리 실패', err);
    if (err && err.code === 'ACCOUNT_BANNED') {
      clearLocalKakaoSessionForBan();
      showToast(err.message || '이 계정은 관리자에 의해 이용이 제한되었습니다.');
    } else {
      showToast('카카오 로그인 실패: ' + (err && err.message ? err.message : String(err)));
    }
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.toString());
  }
}

(function checkKakaoRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) exchangeKakaoCode(code, params.get('state'));
  else if (params.has('error') && params.has('state')) {
    consumeKakaoLoginState(params.get('state'));
    const url = new URL(window.location.href);
    for (const key of ['state', 'error', 'error_description']) url.searchParams.delete(key);
    window.history.replaceState({}, document.title, url.toString());
    showToast('카카오 로그인을 완료하지 못했어요. 다시 시도해주세요.');
  }
})();

function logout() {
  window.TaekilPrivacy?.resetAge();
  localStorage.removeItem(KAKAO_USER_KEY);
  sessionStorage.removeItem(KAKAO_USER_KEY);
  sessionStorage.removeItem('taekilso_kakao_access_token');
  if (firebaseReady && firebaseAuthReady && firebaseAuthUser) { firebase.auth().signOut().catch(() => {}); }
  firebaseAuthUser = null;
  clearLocalPremium();
  updateAuthNav();
  updatePremiumUI();
  showToast('로그아웃했어요');
  goTo('home');
}


/* 상단 메뉴 "택일" 드롭다운 열고 닫기 */
function toggleNavDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('navTaekilDropdown');
  if (dd) dd.classList.toggle('open');
}
document.addEventListener('click', () => {
  const dd = document.getElementById('navTaekilDropdown');
  if (dd) dd.classList.remove('open');
});

function handleAuthNavClick() {
  if (getKakaoUser() || (firebaseReady && firebaseAuthReady && firebaseAuthUser)) {
    goTo('profile');
  } else {
    openAuthModal();
  }
}
