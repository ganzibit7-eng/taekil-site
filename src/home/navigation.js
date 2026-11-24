/* ---------- PREMIUM / PAYAPP (개인 판매자도 사업자등록 없이 이용 가능한 PG) ---------- */
// 1) payapp.kr 에서 "개인" 판매자로 무료 회원가입
// 2) 심사 승인 후 로그인해서 본인이 만든 "판매자 아이디"를 아래에 붙여넣기
const PAYAPP_USERID = "green5797";
const PREMIUM_KEY = 'taekilso_premium';
const PREMIUM_UNTIL_KEY = 'taekilso_premium_until';
const PREMIUM_OWNER_KEY = 'taekilso_premium_owner';
const PREMIUM_DAYS = 30;
// 현재 정적 호스팅 버전은 결제 완료 후 브라우저에서 30일 이용권을 활성화합니다.
// 실제 운영/판매 단계에서는 반드시 PayApp 결제 결과를 서버에서 검증하고
// users/{uid}.premiumUntil을 기록하는 방식으로 전환하세요.
const PAYAPP_FEEDBACK_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/payapp-feedback';
const AI_CHAT_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/ai-chat';
const PREMIUM_USAGE_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/premium-usage';
const PREMIUM_STATUS_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/premium-status';
const ADMIN_USER_ACTION_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/admin-user-action';
const ADMIN_MEMBER_SECURITY_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/admin-member-security';
const MEMBER_LAST_SEEN_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/member-last-seen';
const MEMBER_ACCESS_STATUS_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/member-access-status';
const MEMBER_SELF_DELETE_URL = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/member-self-delete';
// 질문권(소모성 상품): 무료 3개를 다 쓴 뒤 이어서 물어볼 수 있게 해주는 상품입니다.
const AI_QUESTION_PACKS = {
  ai_question_pack_5: { price: 1900, goodname: 'AI 질문권 5개', memo: 'AI 상담 질문 5개 추가', count: 5 },
  ai_question_pack_10: { price: 2500, goodname: 'AI 질문권 10개', memo: 'AI 상담 질문 10개 추가', count: 10 }
};
const PAYAPP_RETURN_URL = window.location.origin + window.location.pathname + '?premium=1';
const PREMIUM_PRICE = 8900;
const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30일

let verifiedPremium = (localStorage.getItem(PREMIUM_KEY) === 'true' && !!localStorage.getItem(PREMIUM_OWNER_KEY));
function getPremiumUntil() {
  const raw = Number(localStorage.getItem(PREMIUM_UNTIL_KEY) || 0);
  return Number.isFinite(raw) ? raw : 0;
}
function getPremiumOwnerKey() {
  try { return localStorage.getItem(PREMIUM_OWNER_KEY) || ''; } catch (e) { return ''; }
}
function clearLocalPremium() {
  verifiedPremium = false;
  localStorage.removeItem(PREMIUM_KEY);
  localStorage.removeItem(PREMIUM_UNTIL_KEY);
  localStorage.removeItem(PREMIUM_OWNER_KEY);
}
function setLocalPremium(until, ownerKey) {
  if (ownerKey !== accountStore.owner()) return false;
  if (!ownerKey || !Number.isFinite(Number(until)) || Number(until) <= Date.now()) { clearLocalPremium(); return false; }
  verifiedPremium = true;
  localStorage.setItem(PREMIUM_KEY, 'true');
  localStorage.setItem(PREMIUM_UNTIL_KEY, String(Number(until)));
  localStorage.setItem(PREMIUM_OWNER_KEY, ownerKey);
  return true;
}
function isPremium() {
  if (!verifiedPremium) return false;
  const owner = getPremiumOwnerKey();
  if (!owner) return false;
  const until = getPremiumUntil();
  if (!until) {
    // 이전 버전의 영구 프리미엄 플래그는 결제 검증값으로 사용할 수 없습니다.
    // 만료일이 없는 오래된 로컬 플래그는 무료로 되돌립니다.
    clearLocalPremium();
    return false;
  }
  if (Date.now() >= until) {
    clearLocalPremium();
    return false;
  }
  // current가 아직 확인되지 않은 경우(로그인 상태를 비동기로 복원하는 중인 아주 짧은 순간)에는
  // 저장된 소유자 정보를 함부로 지우지 않습니다. 실제로 "다른 계정"인 것이 확인된 경우에만 지웁니다.
  const current = accountStore.owner();
  if (!current) return false;
  if (current && current !== owner) { clearLocalPremium(); return false; }
  return true;
}
function premiumUntilDate() {
  const until = getPremiumUntil();
  return until ? new Date(until) : null;
}
function formatPremiumUntil() {
  const d = premiumUntilDate();
  if (!d) return '';
  const remain = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}까지 · ${remain}일 남음`;
}


/* ---------- ROUTING ---------- */
function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('mobile-open');
}
function showToast(msg) {
  const host = document.getElementById('toastHost');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

let homeFreeScrollMode = false;

function updateHomeFreeScrollMode() {
  const home = document.getElementById('view-home');
  const faq = document.getElementById('homeFaqSection');
  const homeVisible = !!(home && home.classList.contains('visible'));

  if (!homeVisible || !faq) {
    homeFreeScrollMode = false;
    document.documentElement.classList.remove('home-free-scroll');
    return;
  }

  const faqTop = faq.getBoundingClientRect().top + window.scrollY;

  // FAQ의 상단에 도달하면 PPT형 snap을 풀어 FAQ → footer를 자유롭게 이동합니다.
  if (!homeFreeScrollMode && window.scrollY >= faqTop - 8) {
    homeFreeScrollMode = true;
    document.documentElement.classList.add('home-free-scroll');
    return;
  }

  // 다시 FAQ보다 위로 충분히 올라오면 기존 PPT형 snap을 복구합니다.
  if (homeFreeScrollMode && window.scrollY < faqTop - 140) {
    homeFreeScrollMode = false;
    document.documentElement.classList.remove('home-free-scroll');
  }
}

window.addEventListener('scroll', updateHomeFreeScrollMode, { passive:true });
window.addEventListener('resize', updateHomeFreeScrollMode, { passive:true });

function goTo(route, presetEvent, navigationOptions) {
  // admin 화면을 떠날 때는 실시간 통계 감시를 꺼서, 다른 화면 보는 동안 불필요하게
  // 계속 서버와 연결되어 있지 않도록 합니다.
  if (route !== 'admin') {
    window.__cleanupLegacyAdminViews?.();
    if (typeof adminStatsUnsub === 'function') { adminStatsUnsub(); adminStatsUnsub = null; }
    if (typeof adminDailyVisitsUnsub === 'function') { adminDailyVisitsUnsub(); adminDailyVisitsUnsub = null; }
    if (typeof adminFunnelUnsub === 'function') { adminFunnelUnsub(); adminFunnelUnsub = null; }
    if (adminDailyVisitsMidnightTimer) { clearTimeout(adminDailyVisitsMidnightTimer); adminDailyVisitsMidnightTimer = null; }
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('visible'));
  const target = document.getElementById('view-' + route);
  if (target) target.classList.add('visible');
  document.documentElement.classList.toggle('snap-active', route === 'home');
  document.documentElement.classList.remove('home-free-scroll');
  homeFreeScrollMode = false;
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navLink = document.querySelector('.nav-links a[data-route="' + route + '"]');
  if (navLink) navLink.classList.add('active');
  document.getElementById('navLinks').classList.remove('mobile-open');
  document.querySelectorAll('.bt-item').forEach(b => b.classList.remove('active'));
  const btItem = document.querySelector('.bt-item[data-route="' + route + '"]');
  if (btItem) btItem.classList.add('active');
  else if (route === 'profile') document.getElementById('bottomProfileTab').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (history.replaceState) {
    const u = new URL(location.href);
    const {sharePath, shareRoute} = document.documentElement.dataset;
    const sameShare = sharePath && route === shareRoute;
    if (sharePath) u.pathname = sameShare ? sharePath : '/';
    u.hash = sameShare || route === 'home' ? '' : route;
    const nextUrl = u.pathname + u.search + u.hash;
    if (!navigationOptions?.skipHistory && nextUrl !== location.pathname + location.search + location.hash) history.pushState(null, '', nextUrl);
  }

  if (route === 'tool' && presetEvent) {
    selectToolEvent(presetEvent);
  }
  if (route === 'history') {
    loadHistory(navigationOptions?.historyTab);
  }
  if (route === 'home' && typeof fillAiChatDateSelects === 'function') { fillAiChatDateSelects(); updateHomeGuestHint(); }
  if (route === 'profile') renderProfile();
  if (route === 'admin') renderAdmin();
  if (route === 'support') renderSupportList();
}
function openReportHistory() {
  goTo('history', undefined, {historyTab:'reports'});
}
function safeRoute(route) {
  if (route === 'wealth') return 'topic-wealth';
  if (route === 'compatibility') return 'relationship-report';
  return document.getElementById('view-' + route) ? route : 'home';
}
function routeAtLocation() {
  const { sharePath, shareRoute } = document.documentElement.dataset;
  const onSharePage = sharePath && (location.pathname === sharePath || location.pathname + '/' === sharePath);
  return safeRoute(location.hash.slice(1) || (onSharePage ? shareRoute : 'home'));
}
// Direct links may need view handlers declared later in the document.
document.addEventListener('DOMContentLoaded', () => {
  goTo(routeAtLocation(), undefined, {skipHistory:true});
  /* STARTUP_READY */
  window.TaekilStartup?.routed();
  /* END_STARTUP_READY */
}, {once:true});
function restoreRouteFromHistory(){
  const route = routeAtLocation();
  if (document.getElementById('view-' + route)?.classList.contains('visible')) return;
  goTo(route, undefined, {skipHistory:true});
}
window.addEventListener('hashchange', restoreRouteFromHistory);
window.addEventListener('popstate', restoreRouteFromHistory);

function renderTodayGanji() {
  const el = document.getElementById('todayGanji');
  if (!el) return;
  const today = new Date();
  const idx = dayGanjiIndex(today);
  const ganji = ganjiName(idx);
  const oh = ohaengOf(idx);
  const dateStr = `${today.getMonth()+1}월 ${today.getDate()}일`;
  el.innerHTML = `오늘(${dateStr})의 일진 · <span class="tg-ganji">${ganji}</span> · <span class="oh-${oh}"><span class="oh-dot"></span>${oh}</span>`;
}

/* ---------- SCROLL REVEAL ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.feature, .event-card, .step, .price-card').forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = (i % 4) * 0.06 + 's';
  revealObserver.observe(el);
});

/* ---------- KEYBOARD ACCESSIBILITY ---------- */
document.querySelectorAll('.event-card, .saju-event-card, .event-opt, .faq-item summary').forEach(el => {
  if (el.tagName !== 'SUMMARY' && el.tagName !== 'BUTTON') {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  }
});
