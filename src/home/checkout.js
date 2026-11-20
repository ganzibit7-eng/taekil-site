/* ---------- PREMIUM PAYMENT ACTIONS ---------- */
/*
 * PayApp 결제 연동 진단:
 * - userid가 실제 PayApp 판매자 ID인지 확인
 * - price는 1,000원 이상
 * - feedbackurl은 서버가 없으면 비워둡니다.
 * - PayApp JS API는 기본적으로 새 창을 사용하므로 현재 탭(_self)으로 고정해 팝업 차단을 피함
 */
/* ---------- AI 질문권(소모성, 여러 번 구매 가능) ---------- */
async function purchaseQuestionPack(packId) {
  /* CHECKOUT_START */
  if (!window.TaekilCheckout?.requireOpen()) return;
  return window.TaekilCheckout.run(() => startQuestionPackCheckout(packId));
}

async function startQuestionPackCheckout(packId) {
  /* CHECKOUT_END */
  const pack = AI_QUESTION_PACKS[packId];
  if (!pack) return;
  trackAiFunnel('question_pack_purchase_start', { product: packId, pendingQuestion: getPendingPaidAiQuestion() });
  if (!getKakaoUser() && !(firebaseReady && firebaseAuthReady && firebaseAuthUser)) {
    showToast('먼저 로그인해주세요.');
    openAuthModal();
    return;
  }
  if (!await window.TaekilCheckout.loadSdk()) return;
  if (typeof PayApp === 'undefined') { showToast('결제 모듈을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'); return; }

  let paymentUser = null;
  try {
    paymentUser = await ensureFirestorePaymentAuth();
  } catch (authErr) {
    console.error('질문권 결제 인증 준비 실패', authErr);
    showToast('결제 인증을 준비하지 못했어요. 잠시 후 다시 시도해주세요.');
    return;
  }
  if (!paymentUser || paymentUser.isAnonymous) {
    showToast('로그인 보안 연결을 확인하지 못했어요. 다시 로그인한 뒤 결제를 시도해주세요.');
    return;
  }

  // 결제창으로 이동하기 전에 현재 상담을 로컬/클라우드 기록에 확실히 저장합니다.
  try { await saveCurrentAiConversation(); } catch (e) { console.warn('결제 전 상담 저장 실패', e); }

  const orderId = 'TAK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const uidForOrder = paymentUser.uid;
  try {
    if (PAYAPP_FEEDBACK_URL) {
      if (!db) { showToast('결제 요청 저장소에 연결하지 못했어요. 잠시 후 다시 시도해주세요.'); return; }
      await db.collection('paymentOrders').doc(orderId).set({
        uid: uidForOrder,
        amount: pack.price,
        product: packId,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    /* CHECKOUT_START */
    if (!window.TaekilCheckout?.requireOpen()) return;
    /* CHECKOUT_END */
    localStorage.setItem('taekilso_pending_order', JSON.stringify({
      orderId,
      amount: pack.price,
      product: packId,
      expectedCredits: pack.count,
      paymentUid: paymentUser.uid,
      activeConversationId: window.__aiConversationId || null,
      createdAt: Date.now()
    }));

    const payParams = {
      userid: PAYAPP_USERID,
      shopname: '택일소',
      goodname: pack.goodname,
      price: String(pack.price),
      recvphone: '01000000000',
      smsuse: 'n',
      checkretry: 'y',
      returnurl: PAYAPP_RETURN_URL,
      var1: orderId,
      memo: pack.memo,
      redirectpay: '1'
    };
    if (PAYAPP_FEEDBACK_URL) payParams.feedbackurl = PAYAPP_FEEDBACK_URL;
    PayApp.setParam(payParams);
    PayApp.setTarget('_self');
    PayApp.payrequest();
    showToast('결제창을 열었어요. 결제 완료 후 화면에 나오는 "확인" 버튼을 꼭 눌러주세요.');
    /* CHECKOUT_START */
    return true;
    /* CHECKOUT_END */
  } catch (e) {
    console.error(e);
    localStorage.removeItem('taekilso_pending_order');
    showToast('결제창을 열지 못했어요. 잠시 후 다시 시도해주세요.');
  }
}

async function getQuestionCreditsFromServer(uid){
  if (!db || !uid || uid !== accountStore.owner()) return null;
  try {
    const snap = await db.collection('users').doc(uid).get({ source:'server' });
    if (uid !== accountStore.owner()) return null;
    if (!snap.exists) return null;
    return Number((snap.data() || {}).aiQuestionCredits || 0);
  } catch (e) {
    console.error('질문권 잔액 확인 중 오류', e);
    return null;
  }
}

async function refreshQuestionCreditUI(uid) {
  const token = accountStore.snapshot();
  if (!uid || token.owner !== uid || isPremium() || isAdmin()) return;
  const panel = document.getElementById('aiChatPanel');
  const status = document.getElementById('aiChatStatus');
  if (!status || panel?.style.display !== 'flex') return;
  const previousStatus = status.textContent;
  const conversationId = window.__aiConversationId;
  const credits = await getQuestionCreditsFromServer(uid);
  if (credits == null || !accountStore.current(token) || panel.style.display !== 'flex' ||
      conversationId !== window.__aiConversationId || status.textContent !== previousStatus ||
      document.getElementById('aiChatSendBtn')?.disabled) return;
  if (credits > 0 || previousStatus.startsWith('질문권 ')) {
    updateAiChatStatus(null, null, false, { usingCredit: true, questionCreditsLeft: credits });
  }
}

async function payPremium() {
  /* CHECKOUT_START */
  if (!window.TaekilCheckout?.requireOpen()) return;
  return window.TaekilCheckout.run(() => startPremiumCheckout());
}

async function startPremiumCheckout() {
  /* CHECKOUT_END */
  trackAiFunnel('premium_purchase_start', { pendingQuestion: getPendingPaidAiQuestion() });
  // Spark 무료 운영: 결제창을 열기 위해 Firebase Auth를 강제하지 않습니다.
  // 카카오 로그인 정보는 localStorage로 유지되므로 결제 버튼을 눌렀다고 로그아웃되지 않습니다.
  if (!getKakaoUser() && !(firebaseReady && firebaseAuthReady && firebaseAuthUser)) {
    showToast('먼저 로그인해주세요.');
    openAuthModal();
    return;
  }

  if (!await window.TaekilCheckout.loadSdk()) return;
  if (typeof PayApp === 'undefined') {
    showToast('결제 모듈을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    return;
  }
  if (!PAYAPP_USERID || PAYAPP_USERID === "YOUR_PAYAPP_ID") {
    showToast('페이앱 판매자 아이디를 연결해주세요.');
    return;
  }
  if (isPremium()) {
    showToast('이미 프리미엄을 이용 중이에요.');
    return;
  }

  let paymentUser = null;
  try {
    paymentUser = await ensureFirestorePaymentAuth();
  } catch (authErr) {
    console.error('프리미엄 결제 인증 준비 실패', authErr);
    showToast('결제 인증을 준비하지 못했어요. 잠시 후 다시 시도해주세요.');
    return;
  }
  if (!paymentUser || paymentUser.isAnonymous) {
    showToast('로그인 보안 연결을 확인하지 못했어요. 다시 로그인한 뒤 결제를 시도해주세요.');
    return;
  }

  try { await saveCurrentAiConversation(); } catch (e) { console.warn('결제 전 상담 저장 실패', e); }

  const orderId = 'TAK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const currentKakaoUser = getKakaoUser();
  const uidForOrder = paymentUser.uid;
  try {
    if (currentKakaoUser) {
      localStorage.setItem(KAKAO_USER_KEY, JSON.stringify(currentKakaoUser));
      sessionStorage.setItem(KAKAO_USER_KEY, JSON.stringify(currentKakaoUser));
    }

    if (PAYAPP_FEEDBACK_URL) {
      // 서버 검증 방식: 실제 결제 승인은 페이앱이 서버로 직접 통보하는 feedbackurl에서
      // 처리되고, 이 문서는 그 요청이 맞는 주문인지 서버가 대조하는 용도로만 씁니다.
      if (!db) { showToast('결제 요청 저장소에 연결하지 못했어요. 잠시 후 다시 시도해주세요.'); return; }
      await db.collection('paymentOrders').doc(orderId).set({
        uid: uidForOrder,
        amount: PREMIUM_PRICE,
        product: 'taekilso_premium_30days',
        planVersion: 2,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    // 서버 검증 전이라도, 결제 버튼을 누른 기록 자체는 남겨서 결제 후 돌아왔을 때
    // "결제 확인 중" 화면을 띄우는 데 사용합니다. (프리미엄 활성화 근거로는 쓰지 않습니다)
    /* CHECKOUT_START */
    if (!window.TaekilCheckout?.requireOpen()) return;
    /* CHECKOUT_END */
    localStorage.setItem('taekilso_pending_order', JSON.stringify({
      orderId,
      amount: PREMIUM_PRICE,
      paymentUid: uidForOrder,
      createdAt: Date.now()
    }));

    const payParams = {
      userid: PAYAPP_USERID,
      shopname: '택일소',
      goodname: '2027 신년운세 · 30일 이용권',
      price: String(PREMIUM_PRICE),
      recvphone: '01000000000',
      smsuse: 'n',
      checkretry: 'y',
      returnurl: PAYAPP_RETURN_URL,
      var1: orderId,
      memo: '30일 이용권 · AI 질문 총 30개·하루 최대 10개 · 365일 택일',
      redirectpay: '1'
    };
    // 서버 검증 함수가 연결되어 있으면 feedbackurl도 처음부터 같이 보냅니다. setParam을
    // 두 번 나눠 호출하면 페이앱 쪽에서 두 번째 호출 때 앞서 설정한 값이 초기화되는 등
    // 예상치 못한 동작이 있을 수 있어서, 하나의 객체로 합쳐서 한 번만 호출합니다.
    if (PAYAPP_FEEDBACK_URL) payParams.feedbackurl = PAYAPP_FEEDBACK_URL;
    PayApp.setParam(payParams);

    PayApp.setTarget('_self');
    PayApp.payrequest();
    showToast('결제창을 열었어요. 결제 완료 후 화면에 나오는 "확인" 버튼을 꼭 눌러주세요.');
    /* CHECKOUT_START */
    return true;
    /* CHECKOUT_END */
  } catch (e) {
    console.error(e);
    localStorage.removeItem('taekilso_pending_order');
    showToast('결제창을 열지 못했어요. 잠시 후 다시 시도해주세요.');
  }
}
/*
 * 과거 버전과의 호환을 위해 함수명은 남겨두지만, 클라이언트 자체 확인으로 프리미엄을
 * 지급하지 않습니다. 결제 권한은 PayApp feedbackurl의 서버 검증 결과만 신뢰합니다.
 */
function tryActivatePendingPremium() {
  // 호환용 함수명만 유지합니다. 브라우저 기록만으로 프리미엄을 활성화하지 않습니다.
  // 실제 활성화는 PayApp feedbackurl에서 서버 검증 후 users/{uid}에 기록된 값만 신뢰합니다.
  return false;
}

function readPendingPayment() {
  try { return JSON.parse(localStorage.getItem('taekilso_pending_order') || 'null'); }
  catch (_) { return null; }
}

async function readPaymentConfirmation(pending, owner, questionPack) {
  const snapshot = await db.collection('paymentOrders').doc(pending.orderId).get({ source: 'server' });
  const order = snapshot.exists && snapshot.data();
  if (!order || order.uid !== owner) return { state: 'pending' };
  const expectedProduct = questionPack ? pending.product : 'taekilso_premium_30days';
  if (order.product !== expectedProduct) return { state: 'pending' };
  if (['refunded', 'partially_refunded', 'cancelled'].includes(order.status)) return { state: 'cancelled' };
  if (order.status !== 'paid') return { state: 'pending' };
  if (order.entitlementGranted === false) return { state: 'review' };

  if (!questionPack) return { state: await checkPremiumOnServer(owner) ? 'paid' : 'pending' };
  const credits = await getQuestionCreditsFromServer(owner);
  return credits == null ? { state: 'pending' } : { state: 'paid', credits };
}

let paymentConfirmationRunning = false;
async function confirmReturnedPayment() {
  const pending = readPendingPayment();
  if (paymentConfirmationRunning || !db || !pending?.orderId ||
      !Number.isFinite(pending.createdAt) || Date.now() - pending.createdAt > 30 * 60 * 1000) return;
  const token = accountStore.snapshot();
  if (!token.owner || (pending.paymentUid && token.owner !== pending.paymentUid)) return;
  const questionPack = AI_QUESTION_PACKS[pending.product];
  if (pending.product && !questionPack) return;

  const current = () => accountStore.current(token) && readPendingPayment()?.orderId === pending.orderId;
  const retryUntil = Date.now() + 90000;
  paymentConfirmationRunning = true;
  showToast('결제와 이용권 지급을 확인하고 있어요…');
  try {
    while (current() && Date.now() < retryUntil) {
      const result = await readPaymentConfirmation(pending, token.owner, questionPack).catch(() => ({ state:'pending' }));
      if (!current()) return;
      if (result.state === 'review') {
        showToast('결제는 확인됐지만 이용권 지급은 확인이 필요해요. 택일소에 문의해 주세요.');
        return;
      }
      if (result.state !== 'pending') {
        localStorage.removeItem('taekilso_pending_order');
        sessionStorage.removeItem('taekilso_pending_order');
        if (result.state === 'cancelled') {
          showToast('취소 또는 환불된 결제예요. 이 주문의 이용권은 지급되지 않아요.');
          return;
        }

        const restored = restoreActiveAiConversation({ silent:true, resumePendingQuestion:false });
        const resumeQuestion = Boolean(getPendingPaidAiQuestion()) && (!questionPack || result.credits > 0);
        trackSeoConversion('purchases');
        if (questionPack) {
          trackAiFunnel('question_pack_purchase_confirmed', { product:pending.product, credits:result.credits });
          showToast(`질문권 ${questionPack.count}개 결제가 확인됐어요. 현재 ${result.credits}개 남아 있어요.` +
            (resumeQuestion ? ' 이전 질문을 이어갈게요.' : ''));
          window.dispatchEvent(new CustomEvent('taekilso:questionPackPurchased', { detail:{ credits:result.credits } }));
        } else {
          trackAiFunnel('premium_purchase_confirmed', {});
          showToast('프리미엄이 활성화됐어요!' + (resumeQuestion ? ' 이전 질문을 이어갈게요.' : ''));
        }
        setTimeout(() => {
          if (!accountStore.current(token)) return;
          if (!restored) restoreActiveAiConversation({ silent:true });
          if (resumeQuestion) resumePendingPaidAiQuestion();
          else if (!getPendingPaidAiQuestion()) restoreAlgorithmicFollowupsAfterPurchase();
        }, 700);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    if (current()) showToast('아직 결제 확인 중이에요. 다시 결제하기 전에 새로고침해서 확인해 주세요.');
  } finally {
    paymentConfirmationRunning = false;
    // Authentication can change while a server read with the previous session is pending.
    if (!accountStore.current(token) && accountStore.owner()) void confirmReturnedPayment();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  restoreKakaoUserState();
  updateAuthNav();
  const url = new URL(window.location.href);
  if (url.searchParams.get('premium') === '1') {
    url.searchParams.delete('premium');
    window.history.replaceState(window.history.state, '', url);
  }
  window.addEventListener('taekilso:authChanged', confirmReturnedPayment);
  void waitForAuthSettled(6000).then(confirmReturnedPayment);
});

async function checkPremiumOnServer(uid) {
  if (!db || !uid || uid !== accountStore.owner()) return false;
  try {
    const snap = await db.collection('users').doc(uid).get({ source: 'server' });
    if (uid !== accountStore.owner()) return false;
    if (!snap.exists) return false;
    const data = snap.data() || {};
    let until = 0;
    if (data.premiumUntil && typeof data.premiumUntil.toMillis === 'function') until = data.premiumUntil.toMillis();
    else if (typeof data.premiumUntil === 'number') until = data.premiumUntil;
    if (data.premium === true && until > Date.now()) {
      setLocalPremium(until, uid);
      updateAuthNav();
      updatePremiumUI();
      return true;
    }

    const recovered = await recoverPremiumFromVerifiedServer(uid);
    return !!(recovered && recovered.active);
  } catch (e) {
    console.error('결제 확인 중 오류', e);
    const recovered = await recoverPremiumFromVerifiedServer(uid);
    return !!(recovered && recovered.active);
  }
}

// Kept only as a compatibility hook. Never call this from a URL or payment return page.
// The server-side PayApp webhook must set users/{uid}.premium=true first.
async function activatePremiumAfterVerifiedPayment() {
  await refreshPremiumFromServer();
}

async function refreshPremiumFromServer() {
  if (!firebaseReady || !db) return false;
  const user = firebaseAuthUser;
  if (!user) return false;

  try {
    const snap = await db.collection('users').doc(user.uid).get({ source:'server' });
    if (user.uid !== accountStore.owner()) return false;
    const data = snap.exists ? (snap.data() || {}) : {};
    let until = 0;
    if (data.premiumUntil && typeof data.premiumUntil.toMillis === 'function') until = data.premiumUntil.toMillis();
    else if (typeof data.premiumUntil === 'number') until = data.premiumUntil;

    if (data.premium === true && until > Date.now()) {
      setLocalPremium(until, user.uid);
    } else {
      const recovered = await recoverPremiumFromVerifiedServer(user.uid);
      if (user.uid !== accountStore.owner()) return false;

      if (!(recovered && recovered.active)) {
        // 복구 서버가 명확히 비활성이라고 확인했을 때만 해제.
        if (recovered && recovered.active === false && getPremiumOwnerKey() === user.uid) {
          clearLocalPremium();
        }
      }
    }

    updateAuthNav();
    updatePremiumUI();

    if (verifiedPremium && !readPendingPayment()?.product) {
      localStorage.removeItem('taekilso_pending_order');
      sessionStorage.removeItem('taekilso_pending_order');
    }
    return verifiedPremium;
  } catch (e) {
    console.error('프리미엄 서버 상태 확인 실패', e);
    // 일시 오류는 기존 프리미엄 표시를 지우지 않습니다.
    return isPremium();
  }
}

function updatePremiumUI() {
  renderSajuVault();
  const premium = isPremium();
  const tier = document.getElementById('profileTier');
  const upgrade = document.getElementById('profileUpgradeBtn');
  if (tier) tier.textContent = premium ? '프리미엄 회원 ✦' : '무료 회원';
  const expiry = document.getElementById('premiumExpiry');
  if (expiry) {
    expiry.style.display = premium ? 'block' : 'none';
    expiry.textContent = premium ? ('이용기간 · ' + formatPremiumUntil()) : '';
  }
  if (upgrade) {
    upgrade.textContent = premium ? ('프리미엄 이용 중 · ' + formatPremiumUntil()) : '프리미엄 30일 · 8,900원 구매';
    upgrade.disabled = false;
  }
  const priceNote = document.getElementById('profilePremiumPriceNote');
  if (priceNote) {
    priceNote.style.display = premium ? 'none' : 'block';
    priceNote.textContent = '8,900원 / 30일 · 질문 총 30개 · 하루 최대 10개 · 자동결제 없음';
  }
}

function buildPremiumProgramPanel() {
  const panel = document.getElementById('premiumProgramPanel');
  if (!panel) return;
  if (!isPremium()) {
    panel.style.display='block';
    panel.innerHTML = `<div class="premium-lock-card"><b>🔒 여기부터 프리미엄 분석입니다</b><p>30일 동안 AI 질문 총 30개(하루 최대 10개)와 365일 택일 후보, 두 사람 궁합, 상세 리포트를 이용할 수 있어요.</p><button class="btn btn-primary" data-checkout-action onclick="payPremium()">8,900원으로 30일 이용하기</button></div>`;
    return;
  }
  const list = window.__chronological || [];
  if (!list.length) { panel.style.display='none'; return; }
  const best = list.slice().sort((a,b)=>b.score-a.score)[0];
  const eventType = (window.__ctx && window.__ctx.eventType) || '택일';
  const high = list.filter(x=>x.score>=1.5).length;
  const son = list.filter(x=>x.lunarInfo && x.lunarInfo.isSonEomneun).length;
  const avg = Math.round(list.reduce((a,b)=>a+b.score,0)/list.length*10)/10;
  const months = {};
  list.forEach(x=>{const k=`${x.date.getFullYear()}-${x.date.getMonth()+1}`;(months[k]??=[]).push(x);});
  const monthRows = Object.entries(months).slice(0,12).map(([k,v])=>{const m=v.slice().sort((a,b)=>b.score-a.score)[0];return `<div><strong>${k.replace('-', '년 ')}월</strong> · ${m.date.getMonth()+1}/${m.date.getDate()} 추천 · ${to100(m.score)}점</div>`}).join('');
  const couple = window.__ctx && window.__ctx.coupleMode ? '두 분의 기운을 함께 반영한 결과입니다.' : '단독 택일 기준으로 분석했습니다.';
  panel.style.display='block';
  panel.innerHTML = `<div class="pp-head"><div><div class="pp-kicker">✦ PREMIUM DEEP REPORT</div><div class="pp-title">${eventType} 정밀 택일 리포트</div></div><div class="pp-score">${to100(best.score)}<small style="font-size:11px;color:var(--muted)"> / BEST</small></div></div><div class="pp-grid"><div class="pp-stat"><small>최우선 추천일</small><b>${best.date.getFullYear()}.${String(best.date.getMonth()+1).padStart(2,'0')}.${String(best.date.getDate()).padStart(2,'0')}</b></div><div class="pp-stat"><small>강한 추천 후보</small><b>${high}일</b></div><div class="pp-stat"><small>손없는 날</small><b>${son}일</b></div><div class="pp-stat"><small>후보 평균 기운</small><b>${avg}</b></div><div class="pp-stat"><small>최고 일진</small><b>${best.ganji}(${best.ganjiHanja})</b></div><div class="pp-stat"><small>핵심 오행</small><b>${best.ohaeng}</b></div></div><p class="pp-text"><b>최우선 추천일 ${best.date.getMonth()+1}월 ${best.date.getDate()}일</b>은 ${best.ohaeng} 기운과 현재 행사 조건을 종합했을 때 가장 높은 점수를 받은 날짜입니다. ${best.reasons.length ? '주요 근거는 '+best.reasons.slice(0,3).join(', ')+'입니다.' : '특별한 감점 요인이 적은 편입니다.'} ${couple}</p><div class="pp-list"><div><strong>좋은 점</strong><br>${best.reasons.length ? best.reasons.join(' · ') : '전체 기준에서 무난한 흐름'}</div><div><strong>체크할 점</strong><br>${cautionTextFor(eventType)}</div></div><div style="margin-top:18px"><div class="pp-kicker">MONTHLY BEST</div><div class="pp-list">${monthRows || '<div>월별 후보가 없습니다.</div>'}</div></div><button class="btn btn-primary no-print" style="width:100%; margin-top:20px;" onclick="window.print()">📄 이 리포트 PDF로 저장</button>`;
}

function openAuthModal() {
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('authSetupNotice').style.display = firebaseReady ? 'none' : 'block';
  document.getElementById('authError').style.display = 'none';
}
function closeAuthModal() { document.getElementById('authOverlay').style.display = 'none'; }

/* STARTUP_READY */
window.TaekilStartup?.initialized();
/* END_STARTUP_READY */
