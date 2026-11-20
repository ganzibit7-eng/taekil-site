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

  let creditsBeforePurchase = null;
  try {
    if (db) {
      const userSnap = await db.collection('users').doc(paymentUser.uid).get({ source:'server' });
      if (userSnap.exists) creditsBeforePurchase = Number((userSnap.data() || {}).aiQuestionCredits || 0);
    }
  } catch (e) {
    console.warn('결제 전 질문권 잔액 확인 실패', e);
  }

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
      creditsBeforePurchase,
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

/* 질문권처럼 소모성이라 users 문서의 특정 필드로 "구매됨"을 판단할 수 없는 상품은,
   주문(paymentOrders) 문서 자체의 상태가 'paid'로 바뀌었는지로 확인합니다. */
async function checkOrderPaidOnServer(orderId) {
  if (!db || !orderId) return false;
  try {
    const snap = await db.collection('paymentOrders').doc(orderId).get({ source: 'server' });
    return !!(snap.exists && snap.data().status === 'paid');
  } catch (e) { console.error('주문 확인 중 오류', e); return false; }
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

async function waitForVerifiedQuestionPack(pending, uid){
  if (!pending || !pending.orderId) return { confirmed:false, credits:null };

  // 반드시 결제 당시의 Firebase UID를 우선 사용합니다.
  // 카카오 로컬 세션/다른 로그인 흔적 때문에 getCurrentUserKey()가 다른 UID를 가리켜
  // 실제로는 5개가 충전됐는데 0개로 읽는 문제를 방지합니다.
  const verifiedUid = String(pending.paymentUid || uid || '').trim();
  if (!verifiedUid) return { confirmed:false, credits:null };

  const before = Number.isFinite(Number(pending.creditsBeforePurchase))
    ? Math.max(0, Number(pending.creditsBeforePurchase))
    : null;
  const added = Math.max(0, Number(pending.expectedCredits || 0));
  const expectedMinimum = before == null ? null : before + added;

  // PayApp 주문이 paid가 된 직후에도 화면/세션에서 잘못된 UID나 지연된 값을 읽지 않도록
  // 실제 질문권 잔액까지 함께 확인합니다.
  const deadline = Date.now() + 90000;
  let attempt = 0;
  let lastCredits = null;
  let paidSeen = false;

  while (Date.now() < deadline) {
    if (verifiedUid !== accountStore.owner()) return { confirmed:false, credits:null };
    const paid = await checkOrderPaidOnServer(pending.orderId);
    if (verifiedUid !== accountStore.owner()) return { confirmed:false, credits:null };
    if (paid) paidSeen = true;

    if (paidSeen) {
      lastCredits = await getQuestionCreditsFromServer(verifiedUid);

      const balanceLooksApplied =
        lastCredits != null &&
        (
          expectedMinimum == null
            ? lastCredits > 0 || added === 0
            : lastCredits >= expectedMinimum
        );

      if (balanceLooksApplied) {
        return { confirmed:true, credits:lastCredits, uid:verifiedUid };
      }
    }

    attempt += 1;
    const waitMs = attempt <= 8 ? 700 : 1500;
    await new Promise(r => setTimeout(r, waitMs));
  }

  return {
    confirmed: paidSeen,
    credits: lastCredits,
    uid: verifiedUid,
    balancePending: paidSeen
  };
}

async function refreshQuestionCreditUI(uid){
  const credits = await getQuestionCreditsFromServer(uid);
  if (credits == null || uid !== accountStore.owner()) return null;

  const panel = document.getElementById('aiChatPanel');
  if (panel && panel.style.display !== 'none' && credits > 0) {
    updateAiChatStatus(null, null, false, {
      usingCredit: true,
      questionCreditsLeft: credits
    });
  }
  return credits;
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
      createdAt: Date.now()
    }));

    const payParams = {
      userid: PAYAPP_USERID,
      shopname: '택일소',
      goodname: '2027 신년상담 · 30일 이용권',
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

(async function checkPremiumReturn() {
  restoreKakaoUserState();
  updateAuthNav();
  const params = new URLSearchParams(window.location.search);
  const hasPaymentReturnFlag = params.get('premium') === '1';
  const pendingAtLoad = (() => { try { return JSON.parse(localStorage.getItem('taekilso_pending_order') || 'null'); } catch(e) { return null; } })();

  if (hasPaymentReturnFlag || (pendingAtLoad && pendingAtLoad.orderId)) {
    if (hasPaymentReturnFlag) {
      const url = new URL(window.location.href);
      url.searchParams.delete('premium');
      window.history.replaceState({}, document.title, url.toString());
    }

    const pending = pendingAtLoad;
    const PENDING_MAX_AGE_MS = 30 * 60 * 1000;
    const isValidPending = pending && pending.orderId && (Date.now() - pending.createdAt) <= PENDING_MAX_AGE_MS;
    if (!isValidPending) return; // 결제 버튼을 누른 기록 자체가 없으면 아무것도 하지 않습니다.

    // 카카오 로그인은 즉시 확인 가능하지만, Google 로그인은 결제 후 페이지가
    // 완전히 새로고침될 때 로그인 상태를 다시 불러오는 데 짧은 시간이 걸립니다.
    if (!getKakaoUser()) {
      await waitForAuthSettled(6000);
    }

    if (PAYAPP_FEEDBACK_URL) {
      // 서버 검증 방식: 페이앱이 서버로 직접 결제 결과를 통보하고, 서버가 확인한 뒤에만
      // 계정에 프리미엄이 기록됩니다. 그 처리가 몇 초 정도 걸릴 수 있어서, 여기서는
      // 완료될 때까지 몇 번 다시 확인(폴링)합니다.
      showPaymentPendingStatus('결제 확인 중이에요…');
      const uid = String(pending.paymentUid || getCurrentUserKey() || '').trim();
      if (uid !== accountStore.owner()) { hidePaymentPendingStatus(); return; }
      const isQuestionPack = pending.product && AI_QUESTION_PACKS[pending.product];
      let confirmed = false;
      let confirmedCredits = null;

      if (isQuestionPack) {
        const result = await waitForVerifiedQuestionPack(pending, uid);
        confirmed = result.confirmed;
        confirmedCredits = result.credits;
      } else {
        // 프리미엄도 PayApp feedback가 조금 늦을 수 있어 최대 약 90초까지 확인합니다.
        const deadline = Date.now() + 90000;
        while (Date.now() < deadline && !confirmed) {
          confirmed = await checkPremiumOnServer(uid);
          if (uid !== accountStore.owner()) { hidePaymentPendingStatus(); return; }
          if (!confirmed) await new Promise(r => setTimeout(r, 1500));
        }
      }

      hidePaymentPendingStatus();
      if (uid !== accountStore.owner()) return;

      if (confirmed) {
        localStorage.removeItem('taekilso_pending_order');
        sessionStorage.removeItem('taekilso_pending_order');

        // 결제 리턴으로 새로고침돼도 로비/사주입력으로 돌아가지 않고 이전 상담부터 복원합니다.
        const restored = restoreActiveAiConversation({
          silent: true,
          resumePendingQuestion: false
        });

        if (isQuestionPack) {
          if (confirmedCredits == null || confirmedCredits <= 0) {
            const refreshedCredits = await refreshQuestionCreditUI(uid);
            if (refreshedCredits != null && refreshedCredits > 0) {
              confirmedCredits = refreshedCredits;
            }
          } else {
            const panel = document.getElementById('aiChatPanel');
            if (panel && panel.style.display !== 'none') {
              updateAiChatStatus(null, null, false, {
                usingCredit: true,
                questionCreditsLeft: confirmedCredits
              });
            }
          }

          trackSeoConversion('purchases');
          trackAiFunnel('question_pack_purchase_confirmed', {
            product: pending.product,
            credits: confirmedCredits
          });

          const purchasedCount = Number(
            pending.expectedCredits ||
            (AI_QUESTION_PACKS[pending.product] && AI_QUESTION_PACKS[pending.product].count) ||
            0
          );

          // 결제 직후 잔액 조회가 0/null로 잘못 보이더라도 고객에게
          // "0개 남음"이라고 안내하지 않습니다. 결제 완료 사실을 우선 정확히 안내하고,
          // 실제 잔액이 확인된 경우에만 잔여 개수를 표시합니다.
          const creditText = (confirmedCredits != null && confirmedCredits > 0)
            ? `질문권이 충전됐어요. 현재 ${confirmedCredits}개 남아 있어요.`
            : `질문권 ${purchasedCount}개 결제가 완료됐어요. 상담을 시작하면 바로 사용할 수 있어요.`;

          showToast(creditText + (getPendingPaidAiQuestion() ? ' 이전 질문을 이어갈게요.' : ''));

          window.dispatchEvent(new CustomEvent('taekilso:questionPackPurchased', {
            detail: { credits: confirmedCredits }
          }));

          setTimeout(() => {
            if (uid !== accountStore.owner()) return;
            if (!restored) restoreActiveAiConversation({ silent:true });

            if (getPendingPaidAiQuestion()) {
              resumePendingPaidAiQuestion();
            } else {
              setTimeout(() => restoreAlgorithmicFollowupsAfterPurchase(), 180);
            }
          }, 700);
        } else {
          trackAiFunnel('premium_purchase_confirmed', {});
          trackSeoConversion('purchases');
          showToast('프리미엄이 활성화됐어요!' + (getPendingPaidAiQuestion() ? ' 이전 질문을 이어갈게요.' : ''));
          setTimeout(() => {
            if (uid !== accountStore.owner()) return;
            if (!restored) restoreActiveAiConversation({ silent:true });

            if (getPendingPaidAiQuestion()) {
              resumePendingPaidAiQuestion();
            } else {
              setTimeout(() => restoreAlgorithmicFollowupsAfterPurchase(), 180);
            }
          }, 700);
        }
      } else {
        // 주문 기록은 남겨둡니다. 사용자가 새로고침하면 다시 서버 확인을 이어갑니다.
        showToast('결제는 완료됐지만 서버 반영을 기다리고 있어요. 새로고침해도 결제/상담 상태는 유지되며 자동으로 다시 확인합니다.');
      }
    }
  }
})();

function showPaymentPendingStatus(msg) {
  showToast(msg);
}
function hidePaymentPendingStatus() {}

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

    if (verifiedPremium) {
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
