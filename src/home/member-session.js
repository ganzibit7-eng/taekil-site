/* ---------- AUTH (Firebase Spark 무료 플랜) ---------- */
// 1) firebase.google.com 에서 무료 프로젝트 생성
// 2) 프로젝트 설정 > 웹 앱 추가 후 나오는 값을 아래에 붙여넣기
// 3) Authentication > Sign-in method 에서 Google 사용 설정
console.log('[택일소 빌드] v' + '2026-09-09-security-fix-vault-feature' + ' — 이 문구가 콘솔에 안 보이면 예전 캐시본입니다. 강력 새로고침(Ctrl+Shift+R) 해주세요.');
const firebaseConfig = {
  apiKey: "AIzaSyANOyfG-zIBBtQ7alO4K3FNfMy-DXpCQOk",
  authDomain: "auth.taekilso.com",
  projectId: "taekilso",
  storageBucket: "taekilso.firebasestorage.app",
  messagingSenderId: "305797835958",
  appId: "1:305797835958:web:563579c0d08471ea704a17",
  measurementId: "G-LH595SGH6X"
};


const memberAccessCache = new Map();

function clearLocalKakaoSessionForBan() {
  try { localStorage.removeItem(KAKAO_USER_KEY); } catch(e) {}
  try { sessionStorage.removeItem(KAKAO_USER_KEY); } catch(e) {}
  try { sessionStorage.removeItem('taekilso_kakao_access_token'); } catch(e) {}
}

async function checkMemberAccess(user, options = {}) {
  const allowed = await checkAccountRestrictions(user, options);
  if (!allowed || !user || user.isAnonymous) return allowed;
  return window.TaekilAccountAge.ensure(user);
}

async function checkAccountRestrictions(user, options = {}) {
  const strict = !!options.strict;
  if (!user || user.isAnonymous || !MEMBER_ACCESS_STATUS_URL) return true;
  if (String(user.email || '').trim().toLowerCase() === String(ADMIN_EMAIL || '').trim().toLowerCase()) return true;

  const uid = String(user.uid || '');
  const cached = memberAccessCache.get(uid);
  if (cached && Date.now() - cached.at < 2 * 60 * 1000) return cached.allowed;

  async function requestAccessStatus(forceRefreshToken = false) {
    const token = await user.getIdToken(!!forceRefreshToken);
    const res = await fetch(MEMBER_ACCESS_STATUS_URL, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + token
      },
      body:'{}',
      cache:'no-store'
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  try {
    let result = await requestAccessStatus(false);

    if (result.res.status === 401) {
      result = await requestAccessStatus(true);
    }

    if (
      result.res.status === 404 ||
      result.res.status === 405 ||
      result.res.status >= 500
    ) {
      await new Promise(resolve => setTimeout(resolve, 450));
      result = await requestAccessStatus(true);
    }

    const res = result.res;
    const data = result.data;

    if (
      res.status === 403 &&
      (data.error === 'ACCOUNT_BANNED' || data.error === 'ACCOUNT_REJOIN_COOLDOWN')
    ) {
      memberAccessCache.set(uid, { allowed:false, at:Date.now() });
      clearLocalKakaoSessionForBan();
      try { await firebase.auth().signOut(); } catch(e) {}
      firebaseAuthUser = null;

      if (!options.silent) {
        let message = data.message || '이 계정은 현재 이용할 수 없습니다.';
        if (data.error === 'ACCOUNT_REJOIN_COOLDOWN' && data.rejoinAllowedAtMs) {
          message += ' 재가입 가능일: ' +
            new Date(Number(data.rejoinAllowedAtMs)).toLocaleDateString('ko-KR');
        }
        showToast(message);
      }
      return false;
    }

    if (res.ok) {
      memberAccessCache.set(uid, { allowed:true, at:Date.now() });
      return true;
    }

    console.warn('회원 이용상태 확인 실패', res.status, data);

    if (strict) {
      const msg = res.status === 401
        ? '로그인 인증을 확인하지 못했어요. 다시 로그인해주세요.'
        : '회원 이용상태 서버를 확인하지 못했어요. 잠시 후 다시 시도해주세요.';
      showToast(msg);
      try { await firebase.auth().signOut(); } catch(e) {}
      firebaseAuthUser = null;
      return false;
    }

    return true;

  } catch (err) {
    console.warn('회원 이용상태 확인 오류', err);

    if (strict) {
      showToast('회원 이용상태 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');
      try { await firebase.auth().signOut(); } catch(e) {}
      firebaseAuthUser = null;
      return false;
    }

    return true;
  }
}

// 첫 로그인 상태 확인(비동기)이 끝나는 시점에 resolve되는 신호입니다.
// 결제 리턴처럼 "지금 로그인된 사람이 누구인지 반드시 알아야 하는" 로직은
// 이 신호를 기다린 뒤에 최종 판단해야, 로그인 복원이 끝나기 전에 성급하게
// "로그인 정보 없음"으로 잘못 판단하는 일을 막을 수 있습니다.
async function waitForAuthSettled(timeoutMs) {
  if (!firebaseReady) return; // Firebase 자체가 없으면 기다릴 이유가 없음(카카오만 확인)
  await Promise.race([
    firebaseAuthSettled,
    new Promise((resolve) => setTimeout(resolve, timeoutMs || 4000))
  ]);
}
try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY" && window.firebase) {
    firebase.initializeApp(firebaseConfig);
    firebaseReady = true;
    db = firebase.firestore();

    // 로그인 세션을 LOCAL로 고정하고, persistence가 준비된 뒤 auth listener를 붙입니다.
    // 이렇게 해야 iOS Safari/모바일에서 Google 로그인 직후 상태가 사라지는 race condition을 줄일 수 있습니다.
    firebaseAuthInitPromise = firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch((err) => {
        console.warn('Firebase 로그인 저장 설정 실패', err);
        return null;
      })
      .then(() => {
        firebase.auth().onAuthStateChanged(async (user) => {
          window.TaekilAccountAge.observe(user?.uid || null);
          firebaseAuthUser = user || null;
          firebaseAuthReady = true;
          resolveFirebaseAuthSettled();
          if (user) {
            if (!user.isAnonymous) {
              const allowed = await checkMemberAccess(user);
              if (!allowed) {
                updateAuthNav();
                updatePremiumUI();
                return;
              }
            }

            if (!user.isAnonymous && getPremiumOwnerKey() && getPremiumOwnerKey() !== user.uid) clearLocalPremium();

            // Firebase Authentication에는 계정이 있지만 Firestore users/{uid} 문서가
            // 과거 오류로 빠져 있는 회원도 로그인 시 자동 복구합니다.
            // 밴 확인이 끝난 정상 회원에 대해서만 문서를 복구합니다.
            if (!user.isAnonymous) {
              ensureMemberDocumentFromAuth(user);
              touchMemberLastSeen(user, { force:true });
            }

            reconcilePremiumWithAccount(user.uid);
            flushLocalOnlyInquiries();
          }
          updateAuthNav();
          updatePremiumUI();
        });
      });

    // Google 로그인은 storage-partitioned 브라우저에서 redirect state가
    // 유실되는 문제를 피하기 위해 popup 방식만 사용합니다.
    // 방문자 수는 로그인 여부가 확정된 뒤에 기록합니다. 이렇게 해야 지금 접속한 사람이
    // 관리자 계정인지 미리 확인하고, 관리자의 방문은 통계에서 빼놓을 수 있습니다.
    firebaseAuthSettled.then(recordVisit);
    /* CHECKOUT_START */
    window.TaekilCheckout?.watch(db);
    /* CHECKOUT_END */
  }
} catch (err) { console.error('Firebase 초기화 실패', err); }

function formatAuthError(err) {
  const code = err && err.code ? err.code : '';
  const raw = err && err.message ? err.message : '알 수 없는 오류가 발생했어요.';
  if (code === 'auth/unauthorized-domain') return '현재 사이트 주소가 Firebase Authentication의 승인된 도메인에 등록되지 않았어요. Firebase Console → Authentication → Settings → 승인된 도메인에서 현재 도메인을 추가해주세요.';
  if (code === 'auth/popup-blocked') return '브라우저가 Google 로그인 팝업을 막았어요. 팝업을 허용한 뒤 다시 시도해주세요.';
  if (code === 'auth/popup-closed-by-user') return 'Google 로그인 창이 닫혔어요. 다시 시도해주세요.';
  if (code === 'auth/cancelled-popup-request') return 'Google 로그인 요청이 취소됐어요. 다시 시도해주세요.';
  if (code === 'auth/operation-not-supported-in-this-environment') return '현재 브라우저 환경에서는 Google 팝업 로그인을 사용할 수 없어요. Chrome 또는 Safari 일반 탭에서 다시 시도해주세요.';
  if (code === 'auth/network-request-failed') return '네트워크 연결이 불안정해요. Wi-Fi/모바일 데이터를 확인한 뒤 다시 시도해주세요.';
  return raw;
}
function showAuthError(message) {
  const el = document.getElementById('authError');
  if (!el) { showToast(message); return; }
  el.textContent = message;
  el.style.display = 'block';
}

function isAdmin() {
  return !!(firebaseReady && firebaseAuthReady && firebaseAuthUser && firebaseAuthUser.email === ADMIN_EMAIL);
}

/* ---------- 방문/가입/구매 집계 (Firestore) ---------- */

/* 일일 방문수는 한국시간(KST) 00:00를 기준으로 새 문서로 넘어갑니다.
   서버/브라우저의 UTC 날짜를 쓰면 한국시간 오전 9시에 바뀌는 문제가 있어
   모든 일일 방문 집계를 Asia/Seoul 기준으로 통일합니다. */
function getKstDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function msUntilNextKstMidnight() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);
  const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
  // KST는 UTC+9이므로 "다음 한국 날짜 00:00"의 UTC 시각을 계산합니다.
  const kstAsUtc = Date.UTC(
    Number(m.year), Number(m.month) - 1, Number(m.day),
    Number(m.hour) === 24 ? 0 : Number(m.hour),
    Number(m.minute), Number(m.second)
  );
  const nextKstMidnightAsUtc = Date.UTC(
    Number(m.year), Number(m.month) - 1, Number(m.day) + 1, 0, 0, 0
  );
  return Math.max(1000, nextKstMidnightAsUtc - kstAsUtc);
}

function bumpStat(field) {
  if (!db) return;
  db.collection('stats').doc('counters').set(
    { [field]: firebase.firestore.FieldValue.increment(1) },
    { merge: true }
  ).catch(err => console.error('통계 기록 실패', err));
}
/* 방문자 수는 관리자 본인 계정(ADMIN_EMAIL)의 접속은 세지 않고,
   전체 누적(visits)과 오늘 하루치(dailyVisits/오늘 날짜)를 각각 따로 기록합니다. */
/* VISITOR_POLICY_START */
function canRecordVisitorAnalytics(){
  return window.TaekilMetricsPreference?.enabled()&&['taekilso.com','www.taekilso.com'].includes(location.hostname)&&firebaseAuthReady&&!isAdmin()&&String(firebaseAuthUser?.email||'').trim().toLowerCase()!==ADMIN_EMAIL;
}
/* VISITOR_POLICY_END */
function recordVisit() {
  /* VISITOR_GUARD_START */
  if (!canRecordVisitorAnalytics()) return;
  /* VISITOR_GUARD_END */
  bumpStat('visits');
  if (!db) return;
  const todayKey = getKstDateKey();
  db.collection('dailyVisits').doc(todayKey).set(
    { count: firebase.firestore.FieldValue.increment(1), date: todayKey },
    { merge: true }
  ).catch(err => console.error('일일 방문 기록 실패', err));
  recordTrafficSource(todayKey);
}

function detectTrafficSource(){
  let utm='';
  try { utm=(new URLSearchParams(location.search).get('utm_source')||'').toLowerCase().trim(); } catch(e){}
  const ref=(document.referrer||'').toLowerCase();
  let host='';
  try { host=ref ? new URL(ref).hostname.replace(/^www\./,'') : ''; } catch(e){}

  const sourceText=(utm||host||'').toLowerCase();
  if(/google/.test(sourceText)) return {category:'search', channel:'google'};
  if(/naver/.test(sourceText)) return {category:'search', channel:'naver'};
  if(/bing|daum|yahoo/.test(sourceText)) return {category:'search', channel:'otherSearch'};
  if(/threads|thread/.test(sourceText)) return {category:'sns', channel:'threads'};
  if(/instagram|instagr\.am/.test(sourceText)) return {category:'sns', channel:'instagram'};
  if(/facebook|fb\.me/.test(sourceText)) return {category:'sns', channel:'facebook'};
  if(/kakao|kakaotalk/.test(sourceText)) return {category:'sns', channel:'kakao'};
  if(/twitter|x\.com|tiktok/.test(sourceText)) return {category:'sns', channel:'otherSns'};
  if(!ref && !utm) return {category:'direct', channel:'direct'};
  try {
    if(host && host===location.hostname.replace(/^www\./,'')) return {category:'direct', channel:'direct'};
  } catch(e){}
  return {category:'other', channel:'other'};
}

function recordTrafficSource(dateKey){
  /* TRAFFIC_GUARD_START */
  if(!db || !canRecordVisitorAnalytics()) return;
  /* TRAFFIC_GUARD_END */
  const s=detectTrafficSource();
  const inc=firebase.firestore.FieldValue.increment(1);
  db.collection('dailyTrafficSources').doc(dateKey).set({
    date:dateKey,
    total:inc,
    [s.category]:inc,
    [s.channel]:inc
  },{merge:true}).catch(err=>console.warn('유입 경로 기록 실패',err));
}

/*
 * 프리미엄 기능을 실제로 쓸 때마다 서버(Firestore)에 이용 횟수를 1씩 늘립니다.
 * Firestore 규칙에서 "정확히 +1만" 허용하고 그 외 값으로는 못 바꾸게 막아뒀기 때문에,
 * 손님이 개발자도구로 이 값을 0으로 되돌리거나 마음대로 바꿀 수 없습니다.
 * (카카오 로그인은 애초에 진짜 인증이 없어서 이 보호가 적용되지 않는다는 점은
 * 이 서비스 전반에 걸쳐 있는 동일한 한계입니다.)
 */
async function bumpPremiumUsageCount(featureName = 'premium_feature') {
  try {
    const headers = await getAiRequestHeaders();
    const res = await fetch(PREMIUM_USAGE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        feature: String(featureName || 'premium_feature').slice(0, 60)
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('프리미엄 이용 기록 실패', data.error || res.status);
    }
  } catch (err) {
    // 기록 서버 장애 때문에 사용자가 실제 프리미엄 기능을 못 쓰게 하지는 않습니다.
    console.warn('프리미엄 이용 기록 전송 실패', err);
  }
}

async function recordSignup(uid, data) {
  if (!db || !uid) return;

  try {
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get({ source: 'server' });

    if (!snap.exists) {
      await ref.set({
        ...(data || {}),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        premium: false
      }, { merge: true });

      // 레거시 통계도 유지하되, 관리자 화면의 총 가입자수는 실제 users 문서 수를 사용합니다.
      bumpStat('signups');
      bumpDailyFunnel('signups');
      trackSeoConversion('signups');
      /* REPORT_SIGNUP_EVENT_START */
      window.__lastSignupCreatedAt = Date.now();
      window.dispatchEvent(new CustomEvent('taekilso:signupCreated'));
      /* REPORT_SIGNUP_EVENT_END */
      return;
    }

    // 기존 회원 재로그인은 가입자수에 다시 더하지 않고, 빠진 프로필만 보완합니다.
    const existing = snap.data() || {};
    const patch = {};
    if (!existing.email && data && data.email) patch.email = data.email;
    if (!existing.nickname && data && data.nickname) patch.nickname = data.nickname;
    if (!existing.provider && data && data.provider) patch.provider = data.provider;
    if (Object.keys(patch).length) await ref.set(patch, { merge: true });

  } catch (err) {
    console.error('가입 기록 실패', err);
  }
}

function inferAuthProvider(user) {
  if (!user) return '';
  if (String(user.uid || '').startsWith('kakao_')) return 'kakao';

  const providers = Array.isArray(user.providerData)
    ? user.providerData.map(p => p && p.providerId).filter(Boolean)
    : [];

  if (providers.includes('google.com')) return 'google';
  if (providers.includes('password')) return 'legacy-email';
  return providers[0] || 'firebase';
}

async function ensureMemberDocumentFromAuth(user) {
  if (!user || user.isAnonymous || !db) return;

  const provider = inferAuthProvider(user);
  const kakaoProfile = provider === 'kakao' ? getKakaoUser() : null;

  await recordSignup(user.uid, {
    email: user.email || (kakaoProfile && kakaoProfile.email) || null,
    nickname: user.displayName || (kakaoProfile && kakaoProfile.nickname) || null,
    provider
  });
}

const MEMBER_LAST_SEEN_TOUCH_PREFIX = 'taekilso_member_last_seen_touch_v3_';
async function touchMemberLastSeen(user, options = {}){
  if (!user || user.isAnonymous || !window.TaekilAccountAge.confirmed()) return false;

  try {
    const now = Date.now();
    const uid = String(user.uid || '').trim();
    if (!uid) return false;

    // 사용자별 throttle. force:true인 로그인 직후에는 반드시 서버에 기록합니다.
    const touchKey = MEMBER_LAST_SEEN_TOUCH_PREFIX + uid;
    let lastLocal = 0;
    try { lastLocal = Number(sessionStorage.getItem(touchKey) || 0); } catch(e) {}

    const force = !!(options && options.force);
    if (!force && now - lastLocal < 5 * 60 * 1000) return false;

    const provider = inferAuthProvider(user);

    // Firestore 보안 규칙에 lastSeen 필드가 막혀 있어도 확실히 기록되도록
    // Firebase ID token을 검증하는 서버 API를 우선 사용합니다.
    try {
      const token = await user.getIdToken();
      const res = await fetch(MEMBER_LAST_SEEN_URL, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer ' + token
        },
        body:JSON.stringify({
          provider,
          source: provider === 'kakao' ? 'kakao-login' : 'firebase-auth'
        })
      });

      if (res.ok) {
        try { sessionStorage.setItem(touchKey, String(now)); } catch(e) {}
        return true;
      }

      const data = await res.json().catch(() => ({}));
      console.warn('최근 접속시간 서버 기록 실패', res.status, data);
    } catch (serverErr) {
      console.warn('최근 접속시간 서버 호출 실패', serverErr);
    }

    // 서버 API가 아직 배포되지 않은 순간에도 기존 방식으로 한 번 더 시도합니다.
    if (db) {
      const ref = db.collection('users').doc(uid);
      await ref.set({
        lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeenAtMs: now,
        lastSeenProvider: provider,
        lastSeenSource: provider === 'kakao' ? 'kakao-login' : 'firebase-auth'
      }, { merge:true });

      try { sessionStorage.setItem(touchKey, String(now)); } catch(e) {}
      return true;
    }

    return false;
  } catch (err) {
    // 최근 접속 기록 실패가 로그인 자체를 막으면 안 됩니다.
    console.warn('최근 접속시간 기록 실패', err);
    return false;
  }
}

// 이미 로그인한 채로 탭을 다시 열거나 백그라운드에서 돌아온 경우도 접속시간을 갱신합니다.
function refreshCurrentMemberLastSeen(){
  try {
    const user = firebase && firebase.auth ? firebase.auth().currentUser : null;
    if (user && !user.isAnonymous) touchMemberLastSeen(user);
  } catch(e) {}
}
window.addEventListener('focus', refreshCurrentMemberLastSeen);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshCurrentMemberLastSeen();
});


function recordPurchase(orderId, verificationMethod) {
  // 과거 버전 호환용 함수명만 유지합니다.
  // 프리미엄 활성화는 PayApp feedbackurl의 서버 검증만 신뢰합니다.
  return false;
}
function getCurrentUserKey() {
  // Firebase Auth identity is authoritative when available. This prevents a stale
  // Kakao localStorage session from being mistaken for the current account.
  if (firebaseReady && firebaseAuthReady && firebaseAuthUser && !firebaseAuthUser.isAnonymous) return firebaseAuthUser.uid;
  const kakaoUser = getKakaoUser();
  if (kakaoUser) return 'kakao_' + kakaoUser.id;
  if (firebaseReady && firebaseAuthReady && firebaseAuthUser) return firebaseAuthUser.uid;
  return null;
}

/* 로그인 시 계정에 저장된 프리미엄 상태를 이 브라우저로 끌어와서 기기 간 프리미엄 상태를 맞춰줍니다. */
function syncPremiumFromAccount(uid) {
  if (!db || !uid || uid !== accountStore.owner()) return;
  db.collection('users').doc(uid).get({ source: 'server' }).then((snap) => {
    if (uid !== accountStore.owner()) return;
    if (!snap.exists) return;
    const data = snap.data() || {};
    let until = 0;
    if (data.premiumUntil && typeof data.premiumUntil.toMillis === 'function') until = data.premiumUntil.toMillis();
    else if (typeof data.premiumUntil === 'number') until = data.premiumUntil;
    if (data.premium === true && until > Date.now()) {
      setLocalPremium(until, uid);
      updateAuthNav();
      updatePremiumUI();
      localStorage.removeItem('taekilso_pending_order');
      sessionStorage.removeItem('taekilso_pending_order');
      showToast('이 계정의 프리미엄 이용권이 확인됐어요.');
    } else if (until && until <= Date.now()) {
      if (getPremiumOwnerKey() === uid) clearLocalPremium();
      updateAuthNav();
      updatePremiumUI();
    }
  }).catch((err) => console.error('프리미엄 상태 확인 실패', err));
}

/*
 * 결제 당시 Firestore 연결이 안 됐던 경우(예: API 비활성화 상태였던 경우) 이 기기에만
 * 프리미엄 정보가 남아있고 계정에는 반영이 안 될 수 있습니다. 로그인할 때마다 "이 기기의
 * 만료일"과 "계정에 저장된 만료일"을 비교해서, 더 최신(더 늦게 만료되는) 쪽으로 양쪽을
 * 맞춰줍니다. 이러면 PC에서 결제한 프리미엄이 모바일 로그인에서도 정상적으로 보여요.
 */
/* Firestore가 꺼져있던 동안 만들어진 회원 기록에는 이메일/닉네임이 없을 수 있습니다.
   관리자 화면에 UID만 뜨는 문제를 막기 위해, 로그인할 때마다 빠진 정보를 채워 넣습니다.
   이미 저장돼있는 값은 절대 덮어쓰지 않습니다(로그인마다 조용히 한 번씩만 채워짐). */
function backfillUserProfile(uid, existingData) {
  if (!db || !uid || uid !== accountStore.owner()) return;
  const kakaoUser = getKakaoUser();
  const fbUser = (firebaseReady && firebaseAuthReady && firebaseAuthUser && !firebaseAuthUser.isAnonymous) ? firebaseAuthUser : null;

  const patch = {};
  if (kakaoUser) {
    if (!existingData.nickname && kakaoUser.nickname) patch.nickname = kakaoUser.nickname;
    if (!existingData.email && kakaoUser.email) patch.email = kakaoUser.email;
    if (!existingData.provider) patch.provider = 'kakao';
  } else if (fbUser) {
    if (!existingData.email && fbUser.email) patch.email = fbUser.email;
    if (!existingData.nickname && fbUser.displayName) patch.nickname = fbUser.displayName;
    if (!existingData.provider) patch.provider = (fbUser.providerData[0] && fbUser.providerData[0].providerId === 'google.com') ? 'google' : 'email';
  }
  if (Object.keys(patch).length > 0) {
    db.collection('users').doc(uid).set(patch, { merge: true }).catch(() => {});
  }
}


async function recoverPremiumFromVerifiedServer(uid){
  if (!uid || uid !== accountStore.owner()) return null;

  try {
    const headers = await getAiRequestHeaders();
    if (uid !== accountStore.owner()) return null;
    const res = await fetch(PREMIUM_STATUS_URL, {
      method:'POST',
      headers,
      body:JSON.stringify({ uid })
    });

    const data = await res.json().catch(() => ({}));
    if (uid !== accountStore.owner()) return null;
    if (!res.ok) {
      console.warn('프리미엄 서버 복구 확인 실패', data.error || res.status);
      return null;
    }

    if (data.active && Number(data.premiumUntil || 0) > Date.now()) {
      setLocalPremium(Number(data.premiumUntil), uid);
      updateAuthNav();
      updatePremiumUI();
      return data;
    }

    return data;
  } catch (err) {
    console.warn('프리미엄 서버 복구 요청 실패', err);
    return null;
  }
}

async function reconcilePremiumWithAccount(uid) {
  if (!db || !uid || uid !== accountStore.owner()) return;
  syncSajuVaultFromCloud(uid);

  try {
    const snap = await db.collection('users').doc(uid).get({ source: 'server' });
    if (uid !== accountStore.owner()) return;
    const data = snap.exists ? (snap.data() || {}) : {};
    backfillUserProfile(uid, data);

    let serverUntil = 0;
    if (data.premiumUntil && typeof data.premiumUntil.toMillis === 'function') {
      serverUntil = data.premiumUntil.toMillis();
    } else if (typeof data.premiumUntil === 'number') {
      serverUntil = data.premiumUntil;
    }

    const now = Date.now();

    if (data.premium === true && serverUntil > now) {
      setLocalPremium(serverUntil, uid);
      updateAuthNav();
      updatePremiumUI();
      localStorage.removeItem('taekilso_pending_order');
      sessionStorage.removeItem('taekilso_pending_order');
      return;
    }

    // 예전 회원 문서가 일부 필드만 남았거나 실수로 재생성된 경우에도,
    // 이미 결제 완료된 premium paymentOrders가 있으면 서버에서 권한을 복구합니다.
    // 관리자 회수 이력이 더 최신이면 복구하지 않도록 서버가 판정합니다.
    const recovered = await recoverPremiumFromVerifiedServer(uid);
    if (uid !== accountStore.owner()) return;
    if (recovered && recovered.active && Number(recovered.premiumUntil || 0) > now) {
      return;
    }

    // 서버 복구 확인까지 끝난 뒤에만 로컬 프리미엄 표시를 해제합니다.
    // 네트워크 오류(null)일 때는 기존 이용권을 함부로 지우지 않습니다.
    if (recovered && recovered.active === false) {
      if (getPremiumOwnerKey() === uid) clearLocalPremium();
      updateAuthNav();
      updatePremiumUI();
    }
  } catch (err) {
    // 일시적인 Firestore 오류 때문에 정상 회원의 프리미엄 표시를 지우지 않습니다.
    console.error('프리미엄 상태 확인 실패', err);
  }
}

/*
 * Firestore 연결이 안 될 때 임시로 이 브라우저에만 저장해뒀던 문의(1:1 문의/환불 요청)를,
 * 로그인 시점(=Firestore가 다시 연결됐을 가능성이 있는 시점)마다 서버로 다시 올려봅니다.
 */
async function flushLocalOnlyInquiries() {
  if (!db) return;

  const list = getMyInquiryList();
  const pending = list.filter(item => item.localOnly);
  if (!pending.length) return;

  const authUser = await ensureFirestorePaymentAuth().catch(() => null);
  if (!authUser || authUser.isAnonymous) return;

  const kakaoUser = getKakaoUser();
  const name = kakaoUser
    ? (kakaoUser.nickname || '카카오 사용자')
    : (authUser.displayName || authUser.email || '회원');

  for (const item of pending) {
    try {
      const docRef = await db.collection('inquiries').add({
        uid: authUser.uid,
        ownerUid: authUser.uid,
        firebaseUid: authUser.uid,
        name,
        title: String(item.title || '').slice(0, 120),
        message: String(item.message || '').slice(0, 5000),
        status: '대기',
        reply: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAtMs: item.createdAt || Date.now(),
        source: kakaoUser ? 'kakao' : 'firebase'
      });

      const cur = getMyInquiryList().filter(x => x.id !== item.id);
      cur.unshift({ id: docRef.id, title: item.title, createdAt: item.createdAt || Date.now() });
      accountStore.setItem(SUPPORT_LIST_KEY, JSON.stringify(cur));

      if (document.getElementById('view-support')?.classList.contains('visible')) {
        renderSupportList();
      }
    } catch (err) {
      console.warn('임시 문의 재전송 실패', err);
    }
  }
}

/* ---------- KAKAO LOGIN (client-side only — no backend session yet) ---------- */
// 1) developers.kakao.com 에서 애플리케이션 생성
// 2) 앱 설정 > 앱 키 > "JavaScript 키", "REST API 키" 복사해서 아래에 붙여넣기
// 3) 앱 설정 > 플랫폼 > Web 플랫폼에 실제 사이트 도메인 등록 (예: https://ganzibit7-eng.github.io)
// 4) 제품 설정 > 카카오 로그인 > 활성화 ON, Redirect URI에 이 페이지 주소 등록
const KAKAO_JS_KEY = "0f7299964f7c22f2c6d1caaca0d33a7d";
const KAKAO_REST_KEY = "189da591834b8e3edfffa2c7afa41c0d";
const KAKAO_REDIRECT_URI = window.location.origin + window.location.pathname;
// 무료(Spark) 운영에서는 별도 Cloud Function 없이 카카오 프로필을 브라우저 세션으로 유지합니다.
const KAKAO_TOKEN_FUNCTION_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/kakao-custom-token';
let kakaoReady = false;
try {
  if (KAKAO_JS_KEY !== "YOUR_KAKAO_JS_KEY" && window.Kakao && !Kakao.isInitialized()) {
    Kakao.init(KAKAO_JS_KEY);
    kakaoReady = true;
  }
} catch (err) { console.error('Kakao 초기화 실패', err); }

const KAKAO_USER_KEY = 'taekilso_kakao_user';

function getKakaoUser() {
  try {
    const raw = localStorage.getItem(KAKAO_USER_KEY) || sessionStorage.getItem(KAKAO_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return (user && user.id) ? user : null;
  } catch (err) { return null; }
}

function restoreKakaoUserState() {
  const user = getKakaoUser();
  if (!user) return null;
  try {
    localStorage.setItem(KAKAO_USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(KAKAO_USER_KEY, JSON.stringify(user));
  } catch (err) {}
  return user;
}

function updateAuthNav() {
  const btn = document.getElementById('authNavBtn');
  const bottomLabel = document.getElementById('bottomProfileLabel');
  const kakaoUser = getKakaoUser();
  const fbUser = (firebaseReady && firebaseAuthReady && firebaseAuthUser && !firebaseAuthUser.isAnonymous) ? firebaseAuthUser : null;
  const premiumTag = isPremium() ? ' ✦' : '';
  let label = '로그인';
  if (fbUser) {
    label = (fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : '회원')) + ' 님' + premiumTag;
  } else if (kakaoUser) {
    label = (kakaoUser.nickname || '카카오 사용자') + ' 님' + premiumTag;
  }
  btn.textContent = label;
  btn.classList.toggle('logged-in', !!(kakaoUser || fbUser));
  if (bottomLabel) bottomLabel.textContent = (kakaoUser || fbUser) ? '프로필' : '로그인';
}

async function copyProfileUid() {
  const el = document.getElementById('profileUid');
  const uid = el ? String(el.textContent || '').trim() : '';
  if (!uid) return;
  try {
    await navigator.clipboard.writeText(uid);
    showToast('회원 UID를 복사했어요.');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = uid;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    ta.remove();
    showToast('회원 UID를 복사했어요.');
  }
}

function renderProfile() {
  const kakaoUser = getKakaoUser();
  const fbUser = (firebaseReady && firebaseAuthReady && firebaseAuthUser && !firebaseAuthUser.isAnonymous) ? firebaseAuthUser : null;
  let name = '회원', meta = '', initial = '택', uid = '';

  // 카카오 로그인은 Firebase Custom Token 세션도 함께 생기므로
  // fbUser가 존재하더라도 UID가 kakao_로 시작하거나 카카오 로컬 프로필이 있으면 카카오로 표시합니다.
  const isKakaoSession = !!(
    kakaoUser ||
    (fbUser && String(fbUser.uid || '').startsWith('kakao_'))
  );

  if (isKakaoSession) {
    name = (kakaoUser && kakaoUser.nickname) ||
      (fbUser && fbUser.displayName) ||
      '카카오 사용자';
    const email = (kakaoUser && kakaoUser.email) || (fbUser && fbUser.email) || '';
    meta = '카카오 회원' + (email ? ' · ' + email : '');
    initial = name.charAt(0);
    uid = (fbUser && fbUser.uid) ||
      (kakaoUser && kakaoUser.id ? 'kakao_' + String(kakaoUser.id) : '');
  } else if (fbUser) {
    name = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : '회원');
    const providers = Array.isArray(fbUser.providerData)
      ? fbUser.providerData.map(p => p && p.providerId).filter(Boolean)
      : [];
    const provider = providers.includes('google.com') ? 'Google 회원' : '이전 회원';
    meta = provider + (fbUser.email ? ' · ' + fbUser.email : '');
    initial = name.charAt(0).toUpperCase();
    uid = fbUser.uid || '';
  }

  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileMeta').textContent = meta;

  const uidRow = document.getElementById('profileUidRow');
  const uidEl = document.getElementById('profileUid');
  if (uidRow && uidEl) {
    uidEl.textContent = uid;
    uidRow.style.display = uid ? 'flex' : 'none';
  }

  const tierEl = document.getElementById('profileTier');
  const upgradeBtn = document.getElementById('profileUpgradeBtn');
  if (isPremium()) {
    tierEl.textContent = '프리미엄 회원';
    tierEl.classList.add('gold');
    upgradeBtn.textContent = '프리미엄 이용 중 · ' + formatPremiumUntil();
    upgradeBtn.disabled = false;
  } else {
    tierEl.textContent = '무료 회원';
    tierEl.classList.remove('gold');
    upgradeBtn.textContent = '프리미엄 30일 이용권 구매';
    upgradeBtn.disabled = false;
  }

  document.getElementById('adminEntryWrap').style.display = isAdmin() ? 'block' : 'none';
}
updateAuthNav();
// 이용권 만료를 화면에 즉시 반영하고, 날짜가 바뀌어도 상태가 갱신되도록 합니다.
// 매 60초마다는 로컬 정보만 재확인하고, 매 3분마다는 서버(Firestore)에도 다시 확인해서
// 관리자가 프리미엄을 회수했을 때 이미 로그인해서 쓰고 있던 화면에도 반영되게 합니다.
setInterval(() => {
  const before = verifiedPremium;
  const nowPremium = isPremium();
  if (before !== nowPremium) { updateAuthNav(); updatePremiumUI(); }
  if (nowPremium) {
    const expiry = document.getElementById('premiumExpiry');
    if (expiry) expiry.textContent = '이용기간 · ' + formatPremiumUntil();
  }
}, 60000);

setInterval(() => {
  const uid = getCurrentUserKey();
  if (uid) reconcilePremiumWithAccount(uid);
}, 3 * 60 * 1000);

// 사용자가 다시 이 탭으로 돌아왔을 때(다른 탭 갔다가 돌아옴 등)도 바로 한 번 재확인합니다.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const uid = getCurrentUserKey();
    if (uid) reconcilePremiumWithAccount(uid);
  }
});
