/* ---------- ADMIN DASHBOARD ---------- */

function adminTimestampMs(value, fallback = 0){
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Date.parse(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function adminFormatDateTime(ms){
  if (!ms) return '기록 없음';
  try {
    return new Date(ms).toLocaleString('ko-KR', {
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit'
    });
  } catch(e) {
    return new Date(ms).toLocaleString('ko-KR');
  }
}

function adminRelativeTime(ms){
  if (!ms) return '기록 없음';
  const diff = Date.now() - ms;
  if (diff < 0) return '방금';
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return adminFormatDateTime(ms);
}

function adminInquiryOwnerUid(q){
  if (!q) return '';
  return String(q.ownerUid || q.firebaseUid || q.uid || '').trim();
}

function buildAdminRecentInquiryMap(qs){
  const map = new Map();
  if (!qs) return map;

  qs.forEach((doc) => {
    const q = doc.data() || {};
    const uid = adminInquiryOwnerUid(q);
    if (!uid) return;

    const createdMs = adminTimestampMs(q.createdAt, Number(q.createdAtMs || 0));
    const status = String(q.status || '').trim();
    const waiting = status !== '답변완료';

    const prev = map.get(uid);
    if (!prev || createdMs > prev.createdMs) {
      map.set(uid, {
        id: doc.id,
        createdMs,
        status,
        waiting,
        title: String(q.title || '').trim()
      });
    }
  });

  return map;
}

async function callAdminUserAction(action, uid, extra){
  const current = firebase.auth().currentUser;
  if (!current) throw new Error('관리자 로그인 세션이 없습니다.');
  const token = await current.getIdToken(true);
  const res = await fetch(ADMIN_USER_ACTION_URL, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':'Bearer ' + token
    },
    body:JSON.stringify({ action, uid, ...(extra || {}) })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data.error || '';
    throw err;
  }
  return data;
}

async function adminAdjustQuestionCreditsFallback(uid, mode, count){
  if (!db || !uid) throw new Error('회원 데이터베이스에 연결되지 않았어요.');
  if (!isAdmin()) throw new Error('관리자 권한이 필요합니다.');

  const ref = db.collection('users').doc(uid);
  let before = 0;
  let after = 0;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('회원 정보를 찾지 못했습니다.');

    const data = snap.data() || {};
    before = Math.max(0, Number(data.aiQuestionCredits || 0));

    if (mode === 'grant') {
      const n = Number(count || 0);
      if (![1,5,10].includes(n)) throw new Error('질문권 수량이 올바르지 않습니다.');
      after = before + n;
      tx.set(ref, {
        aiQuestionCredits: after,
        lastAdminCreditGrantAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastAdminCreditGrantCount: n
      }, { merge:true });
    } else {
      if (count === 'all') {
        after = 0;
      } else {
        const n = Number(count || 0);
        if (![1,5,10].includes(n)) throw new Error('질문권 수량이 올바르지 않습니다.');
        after = Math.max(0, before - n);
      }

      tx.set(ref, {
        aiQuestionCredits: after,
        lastAdminCreditRevokeAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastAdminCreditRevokeCount: Math.max(0, before - after)
      }, { merge:true });
    }
  });

  return {
    ok:true,
    fallback:true,
    questionCredits:after,
    before
  };
}

function askAdminDeletePassword(label){
  return new Promise((resolve) => {
    const old = document.getElementById('adminDeletePasswordBackdrop');
    if (old) old.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'adminDeletePasswordBackdrop';
    backdrop.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'background:rgba(0,0,0,.72)','display:flex',
      'align-items:center','justify-content:center','padding:20px'
    ].join(';');

    const box = document.createElement('div');
    box.style.cssText = [
      'width:min(420px,100%)','background:#171512',
      'border:1px solid rgba(255,255,255,.12)','border-radius:18px',
      'padding:22px','box-shadow:0 24px 80px rgba(0,0,0,.45)'
    ].join(';');

    box.innerHTML = `
      <div style="font-size:18px;color:var(--gold-hi);margin-bottom:8px;">강제탈퇴 최종 확인</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px;">
        ${escapeHtml(label || '선택한 회원')} 회원을 삭제하려면 관리자 비밀번호를 입력해주세요.
      </div>
      <input id="adminDeletePasswordInput" type="password" autocomplete="current-password"
        placeholder="관리자 비밀번호"
        style="width:100%;box-sizing:border-box;padding:13px 14px;border-radius:12px;
        border:1px solid rgba(255,255,255,.14);background:#0f0e0c;color:#fff;outline:none;">
      <div id="adminDeletePasswordError"
        style="min-height:18px;margin-top:8px;font-size:12px;color:#e38b8b;"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
        <button id="adminDeletePasswordCancel" class="btn" type="button">취소</button>
        <button id="adminDeletePasswordOk" class="btn btn-primary" type="button">확인</button>
      </div>
    `;

    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    const input = box.querySelector('#adminDeletePasswordInput');
    const cancel = box.querySelector('#adminDeletePasswordCancel');
    const ok = box.querySelector('#adminDeletePasswordOk');
    const error = box.querySelector('#adminDeletePasswordError');

    const finish = (value) => {
      backdrop.remove();
      resolve(value);
    };

    cancel.onclick = () => finish(null);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) finish(null);
    });

    ok.onclick = () => {
      const value = String(input.value || '');
      if (!value) {
        error.textContent = '비밀번호를 입력해주세요.';
        input.focus();
        return;
      }
      finish(value);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') ok.click();
      if (e.key === 'Escape') cancel.click();
    });

    setTimeout(() => input.focus(), 0);
  });
}


function scrollHomeSection(target){
  let el = null;
  if (target === 'home-ai') {
    el = document.querySelector('#view-home > .home-first-block');
  } else {
    el = document.getElementById(target);
  }
  if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
}


async function callAdminMemberSecurity(action, payload = {}) {
  const current = firebase.auth().currentUser;
  if (!current || current.isAnonymous) throw new Error('관리자 로그인이 필요합니다.');
  const token = await current.getIdToken(true);
  const res = await fetch(ADMIN_MEMBER_SECURITY_URL, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':'Bearer ' + token
    },
    body:JSON.stringify({ action, ...payload })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.code = data.error || '';
    err.status = res.status;
    throw err;
  }
  return data;
}

async function forceDeleteMember(uid, label){
  if (!uid) return;
  const me = firebase.auth().currentUser;
  if (me && me.uid === uid) {
    showToast('현재 로그인한 관리자 본인 계정은 강제탈퇴할 수 없어요.');
    return;
  }

  const first = confirm(
    `${label || uid} 회원을 강제탈퇴할까요?\n\n` +
    `• Firebase 로그인 계정 삭제\n` +
    `• 회원 프로필/사주 보관함/AI 상담 삭제\n` +
    `• 결제·문의 기록은 보존\n\n` +
    `이 작업은 되돌릴 수 없습니다.`
  );
  if (!first) return;

  const typed = prompt('실수 방지를 위해 "강제탈퇴"를 입력해주세요.');
  if (typed !== '강제탈퇴') {
    showToast('강제탈퇴가 취소됐어요.');
    return;
  }

  // 최종 3차 확인. 비밀번호는 코드에 저장하지 않고
  // 서버의 ADMIN_DELETE_PASSWORD Secret과 서버에서만 비교합니다.
  const deletePassword = await askAdminDeletePassword(label || uid);
  if (!deletePassword) {
    showToast('강제탈퇴가 취소됐어요.');
    return;
  }

  try {
    showToast('영구 밴을 저장한 뒤 회원 계정을 삭제하는 중이에요…');
    const result = await callAdminMemberSecurity('force_delete', { uid, deletePassword });
    if (!result || !result.permanentlyBanned || !result.banId) {
      throw new Error('영구 밴 저장 확인에 실패했습니다.');
    }
    showToast('회원 강제탈퇴 및 영구 밴이 완료됐어요.');
    await loadAdminBanList();
  } catch (err) {
    console.error('관리자 강제탈퇴 실패', err);
    showToast('강제탈퇴 실패: ' + err.message);
  }
}


let adminPermState = {
  uid: '',
  label: '',
  mode: 'grant',
  type: 'premium',
  count: 1
};

function openAdminPermissionModal(uid, label, mode){
  adminPermState = {
    uid: String(uid || ''),
    label: String(label || uid || ''),
    mode: mode === 'revoke' ? 'revoke' : 'grant',
    type: 'premium',
    count: 1
  };
  const backdrop = document.getElementById('adminPermBackdrop');
  const member = document.getElementById('adminPermMember');
  if (member) member.textContent = adminPermState.label + ' · ' + adminPermState.uid;
  setAdminPermissionMode(adminPermState.mode);
  setAdminPermissionType('premium');
  if (backdrop) backdrop.classList.add('show');
}

function closeAdminPermissionModal(){
  const backdrop = document.getElementById('adminPermBackdrop');
  if (backdrop) backdrop.classList.remove('show');
}

function setAdminPermissionMode(mode){
  adminPermState.mode = mode === 'revoke' ? 'revoke' : 'grant';

  const grantTab = document.getElementById('adminPermGrantTab');
  const revokeTab = document.getElementById('adminPermRevokeTab');
  if (grantTab) grantTab.classList.toggle('active', adminPermState.mode === 'grant');
  if (revokeTab) revokeTab.classList.toggle('active', adminPermState.mode === 'revoke');

  const submit = document.getElementById('adminPermSubmit');
  if (submit) submit.textContent = adminPermState.mode === 'grant' ? '지급하기' : '회수하기';

  updateAdminPermissionModalText();
}

function setAdminPermissionType(type){
  adminPermState.type = type === 'credits' ? 'credits' : 'premium';

  const premiumOption = document.getElementById('adminPermPremiumOption');
  const creditOption = document.getElementById('adminPermCreditOption');
  const counts = document.getElementById('adminPermCounts');

  if (premiumOption) premiumOption.classList.toggle('active', adminPermState.type === 'premium');
  if (creditOption) creditOption.classList.toggle('active', adminPermState.type === 'credits');
  if (counts) counts.classList.toggle('show', adminPermState.type === 'credits');

  // 지급에서는 "전부"가 의미 없으므로 숨기고, 회수에서만 전부 회수 제공.
  const allBtn = document.querySelector('[data-admin-count="all"]');
  if (allBtn) allBtn.style.display = adminPermState.mode === 'revoke' ? '' : 'none';
  if (adminPermState.mode === 'grant' && adminPermState.count === 'all') setAdminPermissionCount(1);

  updateAdminPermissionModalText();
}

function setAdminPermissionCount(count){
  adminPermState.count = count;
  document.querySelectorAll('#adminPermCounts .admin-perm-count').forEach(btn => {
    const raw = btn.dataset.adminCount;
    const isAll = count === 'all' && raw === 'all';
    const isNumber = count !== 'all' && Number(raw) === Number(count);
    btn.classList.toggle('active', isAll || isNumber);
  });
  updateAdminPermissionModalText();
}

function updateAdminPermissionModalText(){
  const grant = adminPermState.mode === 'grant';
  const premium = adminPermState.type === 'premium';

  const premiumDesc = document.getElementById('adminPermPremiumDesc');
  const creditDesc = document.getElementById('adminPermCreditDesc');
  const note = document.getElementById('adminPermNote');
  const allBtn = document.querySelector('[data-admin-count="all"]');

  if (premiumDesc) premiumDesc.textContent = grant ? '30일 이용권을 지급합니다.' : '현재 프리미엄 이용권을 회수합니다.';
  if (creditDesc) creditDesc.textContent = grant ? '선택한 개수만큼 질문권을 지급합니다.' : '선택한 개수만큼 질문권을 회수합니다.';
  if (allBtn) allBtn.style.display = adminPermState.mode === 'revoke' ? '' : 'none';

  if (!note) return;
  if (premium) {
    note.textContent = grant
      ? '선택한 회원에게 프리미엄 30일을 지급합니다.'
      : '선택한 회원의 프리미엄 권한을 즉시 회수합니다.';
  } else {
    const countText = adminPermState.count === 'all' ? '남은 질문권 전부' : `질문권 ${adminPermState.count}개`;
    note.textContent = grant
      ? `선택한 회원에게 ${countText}를 지급합니다.`
      : `선택한 회원에게서 ${countText}를 회수합니다. 보유 수량보다 많이 회수해도 0개 아래로 내려가지 않습니다.`;
  }
}

async function submitAdminPermissionAction(){
  const { uid, mode, type, count } = adminPermState;
  if (!uid) return;

  try {
    const submit = document.getElementById('adminPermSubmit');
    if (submit) {
      submit.disabled = true;
      submit.textContent = '처리 중…';
    }

    let action = '';
    let extra = {};

    if (type === 'premium') {
      action = mode === 'grant' ? 'grant_premium' : 'revoke_premium';
    } else {
      action = mode === 'grant' ? 'grant_credits' : 'revoke_credits';
      extra.count = count;
    }

    let result;
    try {
      result = await callAdminUserAction(action, uid, extra);
    } catch (serverErr) {
      const backendActionMissing =
        serverErr &&
        (
          serverErr.code === 'UNKNOWN_ACTION' ||
          serverErr.status === 404 ||
          serverErr.status === 405
        );

      // 질문권 지급/회수 API가 아직 구버전으로 배포돼 있으면,
      // 관리자 Firestore 권한으로 동일 작업을 안전하게 한 번 더 처리합니다.
      if (type === 'credits' && backendActionMissing) {
        result = await adminAdjustQuestionCreditsFallback(uid, mode, count);
      } else {
        throw serverErr;
      }
    }

    if (type === 'premium') {
      showToast(mode === 'grant' ? '프리미엄 30일 지급 완료' : '프리미엄 회수 완료');
    } else {
      showToast(
        `${mode === 'grant' ? '질문권 지급' : '질문권 회수'} 완료 · 현재 ${Number(result.questionCredits || 0)}개`
      );
    }

    closeAdminPermissionModal();
  } catch (err) {
    console.error('회원 권한 관리 실패', err);
    showToast('처리 실패: ' + err.message);
  } finally {
    const submit = document.getElementById('adminPermSubmit');
    if (submit) {
      submit.disabled = false;
      submit.textContent = adminPermState.mode === 'grant' ? '지급하기' : '회수하기';
    }
  }
}

function filterAdminUserList(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('#adminUserList .usecase-item').forEach(item => {
    const match = !q || (item.dataset.searchKey || '').includes(q);
    item.style.display = match ? '' : 'none';
  });
}

let adminStatsUnsub = null;
let adminDailyVisitsUnsub = null;
let adminDailyVisitsMidnightTimer = null;
let adminFunnelUnsub = null;
let adminUsersUnsub = null;
let adminMemberSortMode = 'recent_signup';

try {
  const savedAdminMemberSort = sessionStorage.getItem('taekilso_admin_member_sort');
  if (savedAdminMemberSort) adminMemberSortMode = savedAdminMemberSort;
} catch(e) {}

function setAdminMemberSort(mode) {
  const allowed = new Set([
    'recent_signup',
    'recent_access',
    'premium_first',
    'credits_desc',
    'old_signup',
    'name'
  ]);

  adminMemberSortMode = allowed.has(mode) ? mode : 'recent_signup';

  try {
    sessionStorage.setItem('taekilso_admin_member_sort', adminMemberSortMode);
  } catch(e) {}

  const select = document.getElementById('adminMemberSort');
  if (select && select.value !== adminMemberSortMode) {
    select.value = adminMemberSortMode;
  }

  sortAdminUserListDom();
}

function sortAdminUserListDom() {
  const list = document.getElementById('adminUserList');
  if (!list) return;

  const cards = Array.from(list.querySelectorAll('.admin-member-card'));
  if (!cards.length) return;

  cards.sort((a, b) => {
    const aSignup = Number(a.dataset.signupMs || 0);
    const bSignup = Number(b.dataset.signupMs || 0);
    const aSeen = Number(a.dataset.lastSeenMs || 0);
    const bSeen = Number(b.dataset.lastSeenMs || 0);
    const aCredits = Number(a.dataset.credits || 0);
    const bCredits = Number(b.dataset.credits || 0);
    const aPremium = Number(a.dataset.premium || 0);
    const bPremium = Number(b.dataset.premium || 0);
    const aName = String(a.dataset.sortName || '');
    const bName = String(b.dataset.sortName || '');

    if (adminMemberSortMode === 'recent_access') {
      return bSeen - aSeen || bSignup - aSignup;
    }

    if (adminMemberSortMode === 'premium_first') {
      return bPremium - aPremium || bSeen - aSeen || bSignup - aSignup;
    }

    if (adminMemberSortMode === 'credits_desc') {
      return bCredits - aCredits || bSeen - aSeen || bSignup - aSignup;
    }

    if (adminMemberSortMode === 'old_signup') {
      const ax = aSignup || Number.MAX_SAFE_INTEGER;
      const bx = bSignup || Number.MAX_SAFE_INTEGER;
      return ax - bx || bSeen - aSeen;
    }

    if (adminMemberSortMode === 'name') {
      return aName.localeCompare(bName, 'ko');
    }

    // 최근 가입순. 가입일이 없는 레거시 회원은 뒤로 보냅니다.
    if (!aSignup && bSignup) return 1;
    if (aSignup && !bSignup) return -1;
    return bSignup - aSignup || bSeen - aSeen;
  });

  cards.forEach(card => list.appendChild(card));
}

function renderAdmin() {
  window.__cleanupLegacyAdminViews?.();
  const adminToken = accountStore.snapshot();
  let adminViewActive = true;
  const adminCurrent = () => adminViewActive && accountStore.current(adminToken) && isAdmin();
  window.__adminViewToken = adminToken;
  const denied = document.getElementById('adminDenied');
  const content = document.getElementById('adminContent');
  if (!isAdmin()) {
    denied.style.display = 'block';
    content.style.display = 'none';
    return;
  }
  denied.style.display = 'none';
  content.style.display = 'block';

  const sortSelect = document.getElementById('adminMemberSort');
  if (sortSelect) sortSelect.value = adminMemberSortMode;

  if (!db) return;
  const pendingAdminSections = new Set(['adminStatsStatus', 'adminMembersStatus']);
  function adminSectionStatus(id, message, retry = false) {
    if (!adminCurrent()) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.replaceChildren(document.createTextNode(message));
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'aa-btn'; button.textContent = '다시 불러오기';
      button.addEventListener('click', renderAdmin); el.appendChild(button);
    }
  }
  adminSectionStatus('adminStatsStatus', '운영 통계를 불러오고 있습니다…');
  adminSectionStatus('adminMembersStatus', '회원 정보를 불러오고 있습니다…');
  document.getElementById('adminUserList').setAttribute('aria-busy', 'true');
  const adminLoadingTimer = setTimeout(() => {
    pendingAdminSections.forEach(id => adminSectionStatus(id, '조회가 지연되고 있습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.', true));
  }, 15000);

  // 실시간 반영: 관리자가 이 화면을 보고 있는 동안 방문/가입/구매 수가 바뀌면
  // 새로고침 없이 바로 업데이트되도록 한 번 조회하는 대신 계속 지켜보는(onSnapshot)
  // 방식으로 바꿨습니다. 화면을 다시 열 때마다 이전 감시를 정리하고 새로 시작합니다.
  if (adminStatsUnsub) adminStatsUnsub();
  let paymentSignature = null;
  adminStatsUnsub = db.collection('stats').doc('counters').onSnapshot((snap) => {
    if (!adminCurrent()) return;
    pendingAdminSections.delete('adminStatsStatus');
    adminSectionStatus('adminStatsStatus', '운영 통계 · 실시간 반영');
    const d = snap.exists ? snap.data() : {};
    const signature = JSON.stringify([d.purchases,d.revenue,d.purchasesByProduct]);
    if (paymentSignature !== null && paymentSignature !== signature) {
      window.dispatchEvent(new Event('taekilso:paymentSummaryChanged'));
    }
    paymentSignature = signature;
    document.getElementById('statVisits').textContent = d.visits || 0;
    // 총 가입자수는 아래 users 실제 문서 조회 결과로 표시합니다. stats.signups는 레거시 참고값만 유지합니다.
    document.getElementById('statPurchases').textContent = d.purchases || 0;
    const revenue = document.getElementById('statRevenue');
    // 실제 매출: 서버가 결제마다 실제 금액을 그대로 더해서 기록한 값입니다(상품마다 가격이
    // 달라서, 예전처럼 "구매수 × 프리미엄 가격"으로 어림잡으면 질문권 구매까지 프리미엄
    // 가격으로 잘못 계산됩니다).
    if (revenue) revenue.textContent = (d.revenue || 0).toLocaleString('ko-KR') + '원';
    const byProduct = d.purchasesByProduct || {};
    const premiumCount = byProduct.taekilso_premium_30days || 0;
    const qpCount = (byProduct.ai_question_pack_5 || 0) + (byProduct.ai_question_pack_10 || 0);
    const premiumEl = document.getElementById('statPurchasesPremium');
    const annualEl = document.getElementById('statPurchasesNewyear');
    const qpEl = document.getElementById('statPurchasesQuestionPacks');
    if (premiumEl) premiumEl.textContent = premiumCount;
    if (annualEl) annualEl.textContent = byProduct.taekilso_newyear_2027_report || 0;
    if (qpEl) qpEl.textContent = qpCount;
  }, (err) => {
    console.error('통계 실시간 조회 실패', err);
    pendingAdminSections.delete('adminStatsStatus');
    adminSectionStatus('adminStatsStatus', '운영 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', true);
  });

  function watchTodayVisitsKst() {
    const todayKey = getKstDateKey();

    if (adminDailyVisitsUnsub) {
      adminDailyVisitsUnsub();
      adminDailyVisitsUnsub = null;
    }

    const todayEl = document.getElementById('statTodayVisits');
    // 새 날짜 문서가 아직 없더라도 자정 즉시 화면을 0으로 초기화합니다.
    if (todayEl) todayEl.textContent = '0';

    adminDailyVisitsUnsub = db.collection('dailyVisits').doc(todayKey).onSnapshot((snap) => {
      if (todayEl) todayEl.textContent = snap.exists ? (snap.data().count || 0) : 0;
      try { window.dispatchEvent(new CustomEvent('taekilso:todayVisitsUpdated')); } catch(e) {}
    }, (err) => console.error('오늘 방문수 실시간 조회 실패', err));

    if (adminDailyVisitsMidnightTimer) clearTimeout(adminDailyVisitsMidnightTimer);
    adminDailyVisitsMidnightTimer = setTimeout(() => {
      // 한국시간 00:00가 지나면 새 날짜 문서로 자동 전환합니다.
      watchTodayVisitsKst();
      watchTodayTrafficSourcesKst();
    }, msUntilNextKstMidnight() + 1200);
  }

  watchTodayVisitsKst();

  function funnelRate(n, d) {
    if (!d) return '0%';
    return Math.round((Number(n || 0) / Number(d || 1)) * 100) + '%';
  }

  let lastTodayFunnelData = {};
  function renderTodayFunnel(d) {
    lastTodayFunnelData = d || {};
    const visits = Number((document.getElementById('statTodayVisits') || {}).textContent || 0) || 0;
    const steps = [
      ['funnelVisits','funnelVisitsRate',visits,null],
      ['funnelFortune','funnelFortuneRate',Number(d.fortuneResults||0),visits],
      ['funnelAiCta','funnelAiCtaRate',Number(d.aiCtaClicks||0),Number(d.fortuneResults||0)],
      ['funnelSignup','funnelSignupRate',Number(d.signups||0),Number(d.aiCtaClicks||0)],
      ['funnelFirstAi','funnelFirstAiRate',Number(d.firstAiAnswers||0),Number(d.signups||0)],
      ['funnelFreeDone','funnelFreeDoneRate',Number(d.freeLimitExhausted||0),Number(d.firstAiAnswers||0)],
      ['funnelPurchase','funnelPurchaseRate',Number(d.purchases||0),Number(d.freeLimitExhausted||0)]
    ];
    steps.forEach(([id,rid,n,prev],i)=>{
      const el=document.getElementById(id), rate=document.getElementById(rid);
      if(el) el.textContent=String(n);
      if(rate) rate.textContent=i===0?'기준':funnelRate(n,prev);
    });

    const hint=document.getElementById('adminFunnelHint');
    if (hint) {
      const labels=['오늘의 운세 실행','연우 CTA 클릭','신규 가입','첫 AI 답변','무료 3회 소진','결제'];
      const pairs=steps.slice(1).map((s,i)=>({
        label:labels[i], n:Number(s[2]||0), prev:Number(s[3]||0),
        rate:Number(s[3]||0)>0 ? Number(s[2]||0)/Number(s[3]) : null
      })).filter(x=>x.prev>0);
      if (!pairs.length) hint.textContent='오늘 데이터가 쌓이면 가장 큰 이탈 구간을 자동으로 표시합니다.';
      else {
        pairs.sort((a,b)=>a.rate-b.rate);
        const x=pairs[0];
        hint.textContent=`현재 가장 큰 이탈: ${x.label} · 이전 단계 대비 ${Math.round(x.rate*100)}% 전환`;
      }
    }
  }

  function watchTodayFunnelKst() {
    if (adminFunnelUnsub) { adminFunnelUnsub(); adminFunnelUnsub=null; }
    const key=getKstDateKey();
    adminFunnelUnsub=db.collection('dailyFunnel').doc(key).onSnapshot(snap=>{
      renderTodayFunnel(snap.exists ? (snap.data()||{}) : {});
    }, err=>console.warn('오늘 전환 퍼널 조회 실패',err));
  }
  watchTodayFunnelKst();
  let adminSeoUnsub=null;
  function renderSeoLandingPerformance(rows){
    const sum={visits:0,signups:0,firstAiAnswers:0,freeLimitExhausted:0,purchases:0};
    rows.forEach(x=>Object.keys(sum).forEach(k=>sum[k]+=Number(x[k]||0)));
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    set('seoVisits',sum.visits.toLocaleString('ko-KR')); set('seoSignups',sum.signups.toLocaleString('ko-KR'));
    set('seoFirstAi',sum.firstAiAnswers.toLocaleString('ko-KR')); set('seoFreeDone',sum.freeLimitExhausted.toLocaleString('ko-KR'));
    set('seoPurchases',sum.purchases.toLocaleString('ko-KR')); set('seoPurchaseRate',sum.visits?Math.round(sum.purchases/sum.visits*1000)/10+'%':'0%');
    const box=document.getElementById('adminSeoLandingRows'); if(!box)return;
    const top=rows.slice().sort((a,b)=>(Number(b.purchases||0)-Number(a.purchases||0))||(Number(b.visits||0)-Number(a.visits||0))).slice(0,12);
    box.innerHTML=top.length?top.map(x=>{const v=Number(x.visits||0),p=Number(x.purchases||0);return '<div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)"><span>/'+String(x.slug||'')+'/</span><span>'+v+'명</span><b style="color:var(--gold)">'+p+'결제 · '+(v?Math.round(p/v*1000)/10:0)+'%</b></div>';}).join(''):'SEO 유입 데이터가 쌓이면 랜딩페이지별 성과를 표시합니다.';
  }
  function watchSeoLandingPerformance(){
    if(adminSeoUnsub){adminSeoUnsub();adminSeoUnsub=null;}
    const key=getKstDateKey();
    adminSeoUnsub=db.collection('dailySeoLanding').where('date','==',key).onSnapshot(s=>renderSeoLandingPerformance(s.docs.map(d=>d.data()||{})),()=>{});
  }
  watchSeoLandingPerformance();


  let adminTrafficSourceUnsub=null;
  function renderAdminTrafficSources(data,message){
    const totalEl=document.getElementById('trafficSourceTotal');
    const summary=document.getElementById('trafficSourceSummary');
    const list=document.getElementById('trafficSourceChannels');
    list.replaceChildren();
    if(message){
      totalEl.textContent='—';
      summary.textContent=message;
      return;
    }
    const {groups,channels,total}=window.TaekilAnalytics.trafficBreakdown([data]);
    totalEl.textContent=total.toLocaleString('ko-KR')+'건';
    summary.textContent=total?groups.map(row=>row.name+' '+row.value.toLocaleString('ko-KR')).join(' · '):'아직 오늘 집계된 유입이 없어요.';
    for(const channel of channels){
      const row=document.createElement('div');
      const term=document.createElement('dt');
      const count=document.createElement('dd');
      term.textContent=channel.name;
      count.textContent=channel.value.toLocaleString('ko-KR')+'건';
      row.append(term,count);
      list.append(row);
    }
  }
  function watchTodayTrafficSourcesKst(){
    if(adminTrafficSourceUnsub){adminTrafficSourceUnsub();adminTrafficSourceUnsub=null;}
    const key=getKstDateKey();
    adminTrafficSourceUnsub=db.collection('dailyTrafficSources').doc(key).onSnapshot(snap=>{
      if(adminCurrent())renderAdminTrafficSources(snap.exists?(snap.data()||{}):{});
    },()=>{
      if(adminCurrent())renderAdminTrafficSources(null,'유입 기록을 불러오지 못했어요. 관리자 화면을 다시 열어 주세요.');
    });
  }
  renderAdminTrafficSources(null,'유입 기록을 불러오고 있어요.');
  watchTodayTrafficSourcesKst();
  const refreshLegacyFunnel = () => { if (accountStore.current(adminToken) && isAdmin()) renderTodayFunnel(lastTodayFunnelData); };
  window.addEventListener('taekilso:todayVisitsUpdated', refreshLegacyFunnel);

  let recentInquiryByUid = new Map();
  let latestAdminUsers = null;
  // Optional inquiry badges must not block member rows or membership counters.
  db.collection('inquiries').limit(500).get().then(inquiryQs => {
    if (!adminCurrent()) return;
    recentInquiryByUid = buildAdminRecentInquiryMap(inquiryQs);
    if (latestAdminUsers) renderAdminUsers(latestAdminUsers);
  }).catch(err => console.warn('회원 최근 문의 요약 조회 실패', err));
  function renderAdminUsers(qs) {
    if (!adminCurrent()) return;
    latestAdminUsers = qs;
    pendingAdminSections.delete('adminMembersStatus');
    adminSectionStatus('adminMembersStatus', qs.empty ? '등록된 회원이 없습니다.' : '회원 정보 · 실시간 반영');
    document.getElementById('adminUserList').setAttribute('aria-busy', 'false');
    const list = document.getElementById('adminUserList');
    if (qs.empty) {
      list.innerHTML = '<div class="empty-note">아직 가입한 회원이 없어요.</div>';
      const signupEl = document.getElementById('statSignups');
      const kakaoEl = document.getElementById('statKakaoMembers');
      if (signupEl) signupEl.textContent = '0';
      if (kakaoEl) kakaoEl.textContent = '0';
      const activeTodayEl = document.getElementById('statActiveToday');
      const active7dEl = document.getElementById('statActive7d');
      if (activeTodayEl) activeTodayEl.textContent = '0';
      if (active7dEl) active7dEl.textContent = '0';
      const premiumEl = document.getElementById('statActivePremium');
      if (premiumEl) premiumEl.textContent = '0';
      return;
    }

    // Member rows render without waiting for optional inquiry badges.
    list.innerHTML = '';
    // createdAt이 없는 회원(예: Firestore가 꺼져있던 시기에 만들어진 기록)도 빠짐없이 보여주기 위해
    // orderBy 대신 가져온 뒤 이 자리에서 정렬합니다. createdAt이 없으면 맨 뒤로 보냅니다.
    const docs = [];
    qs.forEach((doc) => docs.push(doc));
    docs.sort((a, b) => {
      const au = a.data() || {};
      const bu = b.data() || {};

      const aSignup = adminTimestampMs(au.createdAt, Number(au.createdAtMs || 0));
      const bSignup = adminTimestampMs(bu.createdAt, Number(bu.createdAtMs || 0));
      const aSeen = adminTimestampMs(au.lastSeenAt, Number(au.lastSeenAtMs || 0));
      const bSeen = adminTimestampMs(bu.lastSeenAt, Number(bu.lastSeenAtMs || 0));
      const aCredits = Math.max(0, Number(au.aiQuestionCredits || 0));
      const bCredits = Math.max(0, Number(bu.aiQuestionCredits || 0));

      const aPremiumUntil = adminTimestampMs(au.premiumUntil);
      const bPremiumUntil = adminTimestampMs(bu.premiumUntil);
      const aPremium = au.premium === true && aPremiumUntil > Date.now() ? 1 : 0;
      const bPremium = bu.premium === true && bPremiumUntil > Date.now() ? 1 : 0;

      const aName = String(au.nickname || au.displayName || au.email || a.id || '');
      const bName = String(bu.nickname || bu.displayName || bu.email || b.id || '');

      if (adminMemberSortMode === 'recent_access') {
        return bSeen - aSeen || bSignup - aSignup;
      }

      if (adminMemberSortMode === 'premium_first') {
        return bPremium - aPremium || bSeen - aSeen || bSignup - aSignup;
      }

      if (adminMemberSortMode === 'credits_desc') {
        return bCredits - aCredits || bSeen - aSeen || bSignup - aSignup;
      }

      if (adminMemberSortMode === 'old_signup') {
        const ax = aSignup || Number.MAX_SAFE_INTEGER;
        const bx = bSignup || Number.MAX_SAFE_INTEGER;
        return ax - bx || bSeen - aSeen;
      }

      if (adminMemberSortMode === 'name') {
        return aName.localeCompare(bName, 'ko');
      }

      if (!aSignup && bSignup) return 1;
      if (aSignup && !bSignup) return -1;
      return bSignup - aSignup || bSeen - aSeen;
    });
    const actualMemberCount = docs.length;
    const kakaoMemberCount = docs.filter((doc) => {
      const u = doc.data() || {};
      return u.provider === 'kakao' || String(doc.id).startsWith('kakao_');
    }).length;

    const signupEl = document.getElementById('statSignups');
    const kakaoEl = document.getElementById('statKakaoMembers');
    if (signupEl) signupEl.textContent = actualMemberCount;
    if (kakaoEl) kakaoEl.textContent = kakaoMemberCount;

    const nowMs = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const activeTodayCount = docs.filter((doc) => {
      const u = doc.data() || {};
      return adminTimestampMs(u.lastSeenAt, Number(u.lastSeenAtMs || 0)) >= todayStart.getTime();
    }).length;
    const active7dCount = docs.filter((doc) => {
      const u = doc.data() || {};
      return adminTimestampMs(u.lastSeenAt, Number(u.lastSeenAtMs || 0)) >= nowMs - 7 * 24 * 60 * 60 * 1000;
    }).length;
    const activeTodayEl = document.getElementById('statActiveToday');
    const active7dEl = document.getElementById('statActive7d');
    if (activeTodayEl) activeTodayEl.textContent = activeTodayCount;
    if (active7dEl) active7dEl.textContent = active7dCount;

    docs.forEach((doc) => {
      const u = doc.data() || {};
      const label = u.email || u.nickname || ('회원 (' + doc.id.slice(0, 8) + '…)');

      const untilMs = adminTimestampMs(u.premiumUntil);
      const isActivePremium = u.premium === true && untilMs > Date.now();
      const untilStr = untilMs ? new Date(untilMs).toLocaleDateString('ko-KR') : '';

      const createdMs = adminTimestampMs(u.createdAt, Number(u.createdAtMs || 0));
      const lastSeenMs = adminTimestampMs(u.lastSeenAt, Number(u.lastSeenAtMs || 0));
      const credits = Math.max(0, Number(u.aiQuestionCredits || 0));
      const freeUsed = Math.max(0, Number(u.aiFreeUsed || 0));

      // 예전 회원 중 provider 필드가 비어 있는 경우에도 가능한 범위에서
      // 로그인 경로를 복원해서 관리자 화면에 표시합니다.
      // 확실한 근거가 없으면 Google로 단정하지 않고 '이전 회원'으로 표시합니다.
      const rawProvider = String(u.provider || '').trim().toLowerCase();
      const lastSeenProvider = String(u.lastSeenProvider || '').trim().toLowerCase();
      const memberUid = String(doc.id || '');

      let provider = '이전 회원';
      if (
        rawProvider === 'kakao' ||
        lastSeenProvider === 'kakao' ||
        memberUid.startsWith('kakao_')
      ) {
        provider = 'Kakao';
      } else if (
        rawProvider === 'google' ||
        rawProvider === 'google.com' ||
        lastSeenProvider === 'google' ||
        lastSeenProvider === 'google.com'
      ) {
        provider = 'Google';
      } else if (
        rawProvider === 'email' ||
        rawProvider === 'password' ||
        lastSeenProvider === 'email' ||
        lastSeenProvider === 'password'
      ) {
        provider = '이전 회원';
      } else if (rawProvider && rawProvider !== 'firebase') {
        provider = rawProvider;
      }

      const recentInquiry = recentInquiryByUid.get(doc.id) || null;
      const recentInquiryText = recentInquiry
        ? (recentInquiry.waiting ? `답변 대기 문의 · ${adminRelativeTime(recentInquiry.createdMs)}` : `최근 문의 · ${adminRelativeTime(recentInquiry.createdMs)}`)
        : '';

      const item = document.createElement('div');
      item.className = 'usecase-item admin-member-card';
      item.dataset.signupMs = String(createdMs || 0);
      item.dataset.lastSeenMs = String(lastSeenMs || 0);
      item.dataset.credits = String(credits || 0);
      item.dataset.premium = isActivePremium ? '1' : '0';
      item.dataset.sortName = String(u.nickname || u.displayName || u.email || label || doc.id || '').toLowerCase();
      item.dataset.searchKey = (
        label + ' ' + (u.nickname || '') + ' ' + provider + ' ' + doc.id +
        ' ' + adminFormatDateTime(lastSeenMs) + ' ' + recentInquiryText + ' ' +
        (recentInquiry ? recentInquiry.title : '')
      ).toLowerCase();

      item.innerHTML = `
        <div style="min-width:0; flex:1;">
          <div style="display:flex; align-items:center; gap:7px; flex-wrap:wrap;">
            <strong style="color:var(--gold-hi); font-family:var(--serif); font-weight:400;">${escapeHtml(label)}</strong>
            <span style="font-size:10px;color:var(--muted-2);border:1px solid rgba(255,255,255,.08);padding:2px 6px;border-radius:999px;">${escapeHtml(provider)}</span>
            ${isActivePremium ? `<span style="color:var(--gold-hi);font-size:10px;">프리미엄 · ${untilStr}까지</span>` : ''}
            ${isActivePremium && u.lastVerificationMethod === 'self-confirm' ? `<span style="color:var(--warn); font-size:10px; border:1px solid rgba(201,131,106,.4); padding:2px 6px; border-radius:999px;">⚠ 자가확인</span>` : ''}
            ${recentInquiry ? `<span class="admin-inquiry-badge ${recentInquiry.waiting ? 'waiting' : 'answered'}" title="${escapeHtml(recentInquiry.title || '최근 문의')}">${recentInquiry.waiting ? '● ' : ''}${escapeHtml(recentInquiryText)}</span>` : ''}
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:5px 14px;margin-top:8px;font-size:10.5px;color:var(--muted-2);line-height:1.45;">
            <span>최근 접속 <b style="color:#d9d2c5;font-weight:500;">${escapeHtml(adminRelativeTime(lastSeenMs))}</b></span>
            <span title="${escapeHtml(adminFormatDateTime(lastSeenMs))}">접속시각 ${escapeHtml(adminFormatDateTime(lastSeenMs))}</span>
            <span>가입일 ${escapeHtml(adminFormatDateTime(createdMs))}</span>
            <span>질문권 <b style="color:#d9d2c5;font-weight:500;">${credits}개</b></span>
            <span>무료 AI ${Math.min(freeUsed, 3)}/3 사용</span>
          </div>
          <div style="font-size:9.5px;color:var(--muted-2);margin-top:6px;overflow-wrap:anywhere;">UID ${escapeHtml(doc.id)}</div>
        </div>

        <div style="display:flex; gap:7px; align-items:center; justify-content:flex-end; flex-wrap:wrap; max-width:310px;">
          <span class="text-action" data-perm-grant-uid="${doc.id}" data-perm-label="${escapeHtml(label)}" style="font-size:10.5px;">지급</span>
          <span class="text-action" data-perm-revoke-uid="${doc.id}" data-perm-label="${escapeHtml(label)}" style="font-size:10.5px;color:var(--warn);">회수</span>
          <span class="hist-delete" data-force-delete-uid="${doc.id}" data-force-delete-label="${escapeHtml(label)}" style="font-size:10.5px;color:#e39482;">강제탈퇴</span>
        </div>
      `;
      list.appendChild(item);
    });
    const activeCount = docs.filter(doc => {
      const u = doc.data();
      let untilMs = 0;
      if (u.premiumUntil && typeof u.premiumUntil.toMillis === 'function') untilMs = u.premiumUntil.toMillis();
      else if (typeof u.premiumUntil === 'number') untilMs = u.premiumUntil;
      return u.premium === true && untilMs > Date.now();
    }).length;
    const activeEl = document.getElementById('statActivePremium');
    if (activeEl) activeEl.textContent = activeCount;
    sortAdminUserListDom();

    const searchBox = document.getElementById('adminUserSearch');
    if (searchBox && searchBox.value) filterAdminUserList(searchBox.value);

    list.querySelectorAll('[data-force-delete-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        forceDeleteMember(e.currentTarget.dataset.forceDeleteUid, e.currentTarget.dataset.forceDeleteLabel || '');
      });
    });
    list.querySelectorAll('[data-perm-grant-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const el = e.currentTarget;
        openAdminPermissionModal(el.dataset.permGrantUid, el.dataset.permLabel || '', 'grant');
      });
    });
    list.querySelectorAll('[data-perm-revoke-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const el = e.currentTarget;
        openAdminPermissionModal(el.dataset.permRevokeUid, el.dataset.permLabel || '', 'revoke');
      });
    });
  }
  if (adminUsersUnsub) adminUsersUnsub();
  adminUsersUnsub = db.collection('users').onSnapshot(renderAdminUsers, (err) => {
    if (!adminCurrent()) return;
    latestAdminUsers = null;
    pendingAdminSections.delete('adminMembersStatus');
    adminSectionStatus('adminMembersStatus', '회원 정보를 불러오지 못했습니다.', true);
    document.getElementById('adminUserList').setAttribute('aria-busy', 'false');
    console.error('회원 목록 실시간 조회 실패', err);
    const list = document.getElementById('adminUserList');
    if (list) {
      list.innerHTML = '<div class="empty-note">회원 목록을 불러오지 못했어요.<br><span class="text-action" onclick="renderAdmin()" style="display:inline-block;margin-top:8px;">다시 불러오기</span></div>';
    }
  });

  window.__cleanupLegacyAdminViews = () => {
    adminViewActive = false;
    window.__adminViewToken = null;
    clearTimeout(adminLoadingTimer);
    if (adminStatsUnsub) { adminStatsUnsub(); adminStatsUnsub=null; }
    if (adminUsersUnsub) { adminUsersUnsub(); adminUsersUnsub=null; }
    if (adminSeoUnsub) { adminSeoUnsub(); adminSeoUnsub=null; }
    if (adminTrafficSourceUnsub) { adminTrafficSourceUnsub(); adminTrafficSourceUnsub=null; }
    window.removeEventListener('taekilso:todayVisitsUpdated', refreshLegacyFunnel);
  };
  loadAdminBanList();
  renderAdminInquiries();
}


async function loadAdminBanList() {
  const accountToken = accountStore.snapshot();
  const wrap = document.getElementById('adminBanList');
  if (!wrap || !isAdmin()) return;

  wrap.innerHTML = '<div class="empty-note">밴 목록을 불러오는 중…</div>';

  try {
    const data = await callAdminMemberSecurity('list_bans');
    if (!accountStore.current(accountToken) || !isAdmin()) return;
    const bans = Array.isArray(data.bans) ? data.bans : [];

    if (!bans.length) {
      wrap.innerHTML = '<div class="empty-note">현재 영구 밴된 계정이 없어요.</div>';
      return;
    }

    wrap.innerHTML = '';
    bans.forEach((ban) => {
      const label = ban.email || ban.nickname || ban.uid || '밴 계정';
      const when = ban.bannedAtMs ? adminFormatDateTime(ban.bannedAtMs) : '-';
      const row = document.createElement('div');
      row.className = 'usecase-item';
      row.innerHTML = `
        <div style="min-width:0;flex:1;">
          <strong style="color:#e6c3b9;font-family:var(--serif);font-weight:400;">${escapeHtml(label)}</strong>
          <div style="font-size:10.5px;color:var(--muted-2);margin-top:6px;line-height:1.55;">
            ${escapeHtml(ban.provider || 'unknown')} · 밴 ${escapeHtml(when)}
          </div>
          <div style="font-size:9.5px;color:var(--muted-2);margin-top:4px;overflow-wrap:anywhere;">${escapeHtml(ban.uid || '')}</div>
        </div>
        <span class="text-action" data-unban-id="${escapeHtml(ban.banId || '')}" data-unban-label="${escapeHtml(label)}" style="color:#9fc8a4;font-size:11px;">밴 해제</span>
      `;
      wrap.appendChild(row);
    });

    wrap.querySelectorAll('[data-unban-id]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const el = e.currentTarget;
        await unbanMember(el.dataset.unbanId, el.dataset.unbanLabel || '');
      });
    });
  } catch (err) {
    console.error('밴 목록 조회 실패', err);
    wrap.innerHTML = '<div class="empty-note">밴 목록을 불러오지 못했어요.</div>';
  }
}

async function unbanMember(banId, label) {
  if (!banId) return;
  if (!confirm(`${label || '선택한 계정'}의 영구 밴을 해제할까요?\n\n해제 후에는 다시 가입/로그인할 수 있습니다.`)) return;

  try {
    await callAdminMemberSecurity('unban_user', { banId });
    showToast('영구 밴을 해제했어요.');
    await loadAdminBanList();
  } catch (err) {
    console.error('밴 해제 실패', err);
    showToast('밴 해제 실패: ' + (err.message || err));
  }
}


function renderAdminInquiries() {
  const token = accountStore.snapshot();
  const wrap = document.getElementById('adminInquiryList');
  if (!wrap || !db || !isAdmin()) return;
  mountInquiryQueue({
    wrap, db, pendingCount: document.getElementById('statPendingInquiries'),
    current: () => accountStore.current(token) && isAdmin(), toast: showToast
  });
}
