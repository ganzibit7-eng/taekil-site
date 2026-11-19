/* ---------- SAJU CALC ---------- */
const CHEONGAN = ['갑','을','병','정','무','기','경','신','임','계'];
const JIJI = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const CHEONGAN_HANJA = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const JIJI_HANJA = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const CHEONGAN_OHAENG = ['목','목','화','화','토','토','금','금','수','수'];
const GENERATES = { '목':'화', '화':'토', '토':'금', '금':'수', '수':'목' };
const OVERCOMES = { '목':'토', '토':'수', '수':'화', '화':'금', '금':'목' };
const EVENT_FAVORS = {
  '결혼식': ['화','목'],
  '이사': ['토','금'],
  '개업': ['화','목'],
  '계약체결': ['금','토']
};
const REF_DATE = new Date('1984-02-02T00:00:00');

function dayGanjiIndex(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((d - REF_DATE) / 86400000);
  // 실제 만세력 기준일과 대조해서 확인한 보정값입니다.
  // REF_DATE(1984-02-02)는 갑자일이 아니라 병인일이라, +2 보정을 거쳐야
  // 1984-01-01(갑오), 1985-01-01(경자), 1980-01-04(병자) 등 실제 일진과 일치합니다.
  let idx = (diffDays + 2) % 60;
  if (idx < 0) idx += 60;
  return idx;
}
function ganjiName(idx) { return CHEONGAN[idx % 10] + JIJI[idx % 12]; }
function ganjiHanja(idx) { return CHEONGAN_HANJA[idx % 10] + JIJI_HANJA[idx % 12]; }
function ganjiFull(idx) { return `${ganjiName(idx)}(${ganjiHanja(idx)})`; }
function ohaengOf(idx) { return CHEONGAN_OHAENG[idx % 10]; }
renderTodayGanji();

/* ---------- 손없는 날 (lunar day ending in 9 or 0) via lunar-javascript ---------- */
function getLunarInfo(date) {
  try {
    if (typeof Solar === 'undefined') return null;
    const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const lunar = solar.getLunar();
    const day = lunar.getDay();
    return { lunarDay: day, isSonEomneun: (day % 10 === 9 || day % 10 === 0) };
  } catch (err) {
    console.error('음력 변환 실패', err);
    return null;
  }
}

function scoreDate(userOhaeng, dateOhaeng, eventType) {
  let score = 0;
  const reasons = [];
  const favors = EVENT_FAVORS[eventType];
  if (dateOhaeng === userOhaeng) { score += 1; reasons.push('본인 기운과 같은 성질의 날'); }
  if (GENERATES[userOhaeng] === dateOhaeng || GENERATES[dateOhaeng] === userOhaeng) { score += 2; reasons.push('상생 관계'); }
  if (OVERCOMES[userOhaeng] === dateOhaeng || OVERCOMES[dateOhaeng] === userOhaeng) { score -= 2; reasons.push('상극 관계'); }
  if (favors.includes(dateOhaeng)) { score += 1.5; reasons.push(eventType + '에 어울리는 기운'); }
  return { score, reasons };
}

const dowNames = ['일','월','화','수','목','금','토'];

/* ---------- LOCAL NARRATIVE GENERATOR (no external API needed) ---------- */
function reasonsPhrase(reasons) {
  if (!reasons.length) return '뚜렷한 특징 없이 평이한 기운';
  return reasons.slice(0, 2).join(', ');
}
function generateNarrative(t, eventType, coupleMode, coupleRelation) {
  const seed = t.date.getDate();
  let text;
  const sonNote = (t.lunarInfo && t.lunarInfo.isSonEomneun) ? ' 민속에서 말하는 손없는 날이기도 해요.' : '';
  if (t.score >= 1.5) {
    const options = [
      `일진 ${t.ganji}(${t.ganjiHanja})은 ${reasonsPhrase(t.reasons)}가 겹쳐 ${eventType}에 무난하게 어울리는 날입니다.${sonNote}`,
      `${reasonsPhrase(t.reasons)} 덕에 흐름이 편안한 날이라, ${eventType}을 진행하기에 나쁘지 않습니다.${sonNote}`
    ];
    text = options[seed % options.length];
  } else if (t.score < 0) {
    const options = [
      `일진 ${t.ganji}(${t.ganjiHanja})은 ${reasonsPhrase(t.reasons)}가 있어, 다른 후보 날짜와 함께 비교해보시길 권해요.`,
      `기운이 다소 부딪히는 날이라 급하지 않다면 다른 날을 우선 살펴보는 것도 방법입니다.`
    ];
    text = options[seed % options.length];
  } else {
    const options = [
      `일진 ${t.ganji}(${t.ganjiHanja})은 특별히 좋다 나쁘다 하기보다 평이한 날입니다.${sonNote}`,
      `뚜렷한 상생·상극 없이 무난하게 지나갈 날로 보입니다.${sonNote}`
    ];
    text = options[seed % options.length];
  }
  if (coupleMode && coupleRelation) {
    text += ` 상대방과는 ${coupleRelation}로 나타나 두 분 모두를 함께 고려했습니다.`;
  }
  return text;
}

/* ---------- SHARE & CALENDAR HELPERS ---------- */
function buildIcs(t, eventType) {
  const d = t.date;
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
  const nextDay = new Date(d); nextDay.setDate(nextDay.getDate() + 1);
  const nextStr = `${nextDay.getFullYear()}${pad(nextDay.getMonth()+1)}${pad(nextDay.getDate())}`;
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
    `UID:${Date.now()}@taekilso`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${nextStr}`,
    `SUMMARY:${eventType} 예정일 (택일소 추천)`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${eventType}_${dateStr}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function shareResult(t, eventType) {
  const text = `${eventType} 추천일: ${t.date.getFullYear()}년 ${t.date.getMonth()+1}월 ${t.date.getDate()}일 (일진 ${t.ganji}(${t.ganjiHanja})) — 택일소에서 확인해보세요.`;
  if (navigator.share) {
    navigator.share({ title: '택일소', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('결과를 복사했어요')).catch(() => showToast('복사에 실패했어요'));
  }
}

document.getElementById('eventPicker').addEventListener('click', (e) => {
  const opt = e.target.closest('.event-opt');
  if (!opt) return;
  document.querySelectorAll('.event-opt').forEach(o => o.classList.remove('active'));
  opt.classList.add('active');
});

/* 상단 4개 카드(결혼식/이사/개업/계약체결)를 누르면, 아래 폼에서 해당 목적을 선택된 상태로
   만들고 폼까지 부드럽게 스크롤합니다. */
/* 상단 카드(결혼식/이사/개업/계약체결)를 누르면, 숨겨진 선택값을 그 목적으로 바꾸고
   (보이는 알약 버튼 중복 없이) 바로 아래 입력 폼으로 이동합니다. */
function selectEventAndFocus(eventVal) {
  if (!document.getElementById('view-tool').classList.contains('visible')) goTo('tool');
  document.querySelectorAll('#eventPicker .event-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.val === eventVal);
  });
  const label = document.getElementById('toolSelectedLabel');
  if (label) label.innerHTML = `<strong style="color:var(--gold-hi)">${eventVal}</strong> 날짜를 찾아드릴게요. 생년월일과 가능한 기간을 알려주세요.`;
  const anchor = document.getElementById('toolFormAnchor');
  if (anchor) anchor.style.display = 'block'; // 카드를 눌러야만 날짜 입력 폼이 나타납니다.
  setTimeout(() => {
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

document.getElementById('coupleToggle').addEventListener('change', (e) => {
  document.getElementById('coupleFields').style.display = e.target.checked ? 'block' : 'none';
  document.getElementById('partnerCalType').style.display = e.target.checked ? 'flex' : 'none';
});

/* ---------- 년/월/일 드롭다운 (고령층 접근성) ---------- */
function fillYmdSelects(yearId, monthId, dayId, opts) {
  const yearSel = document.getElementById(yearId);
  const monthSel = document.getElementById(monthId);
  const daySel = document.getElementById(dayId);
  const nowYear = new Date().getFullYear();
  const startYear = (opts && opts.startYear) || nowYear;
  const endYear = (opts && opts.endYear) || (nowYear - 100);

  yearSel.innerHTML = '<option value="">년도</option>' +
    Array.from({ length: startYear - endYear + 1 }, (_, i) => startYear - i)
      .map(y => `<option value="${y}">${y}년</option>`).join('');
  monthSel.innerHTML = '<option value="">월</option>' +
    Array.from({ length: 12 }, (_, i) => i + 1).map(m => `<option value="${m}">${m}월</option>`).join('');

  function refreshDays() {
    const y = parseInt(yearSel.value, 10);
    const m = parseInt(monthSel.value, 10);
    const isLunar = opts && opts.isLunarFn && opts.isLunarFn();
    const maxDay = (!isLunar && y && m) ? new Date(y, m, 0).getDate() : 30;
    const prevVal = daySel.value;
    daySel.innerHTML = '<option value="">일</option>' +
      Array.from({ length: maxDay }, (_, i) => i + 1).map(d => `<option value="${d}">${d}일</option>`).join('');
    if (prevVal && parseInt(prevVal, 10) <= maxDay) daySel.value = prevVal;
  }
  refreshDays();

  yearSel.addEventListener('change', () => { refreshDays(); opts && opts.onChange && opts.onChange(); });
  monthSel.addEventListener('change', () => { refreshDays(); opts && opts.onChange && opts.onChange(); });
  daySel.addEventListener('change', () => { opts && opts.onChange && opts.onChange(); });
}

function syncHiddenDate(yearId, monthId, dayId, hiddenId) {
  const y = document.getElementById(yearId).value;
  const m = document.getElementById(monthId).value;
  const d = document.getElementById(dayId).value;
  const hidden = document.getElementById(hiddenId);
  if (y && m && d) {
    hidden.value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } else {
    hidden.value = '';
  }
}

fillYmdSelects('birthYear', 'birthMonth', 'birthDay', {
  isLunarFn: () => getCalType('birthCalType') === 'lunar',
  onChange: () => { syncHiddenDate('birthYear', 'birthMonth', 'birthDay', 'birthDate'); updateSajuPreview(); }
});
fillYmdSelects('partnerYear', 'partnerMonth', 'partnerDay', {
  isLunarFn: () => getCalType('partnerCalType') === 'lunar',
  onChange: () => syncHiddenDate('partnerYear', 'partnerMonth', 'partnerDay', 'partnerBirthDate')
});
/* ---------- 양력/음력 토글 ---------- */
function setupCalTypeToggle(toggleId, leapWrapId) {
  const toggle = document.getElementById(toggleId);
  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.ct-btn');
    if (!btn) return;
    toggle.querySelectorAll('.ct-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(leapWrapId).style.display = btn.dataset.type === 'lunar' ? 'flex' : 'none';
    if (toggleId === 'birthCalType') updateSajuPreview();
  });
}
// fortuneCalType/insightCalType는 각각 "오늘의 운세"/"내 사주 핵심" 모달 안에 있는데,
// 그 모달들의 HTML은 문서 훨씬 뒷부분에 있습니다. 지금 이 지점에서 바로 찾으면
// 아직 브라우저가 거기까지 읽지 않은 상태라 null이 나올 수 있어서, 문서 전체가
// 완전히 다 읽힌 뒤(DOMContentLoaded)에 실행되도록 확실하게 미룹니다.
setupCalTypeToggle('birthCalType', 'birthLeapWrap');
setupCalTypeToggle('partnerCalType', 'partnerLeapWrap');
applyLockedBirthTo('birth');
function setupLateCalTypeToggles() {
  setupCalTypeToggle('fortuneCalType', 'fortuneLeapWrap');
  setupCalTypeToggle('insightCalType', 'insightLeapWrap');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLateCalTypeToggles);
} else {
  // 이 스크립트가 실행되는 시점에 이미 문서 파싱이 끝나있는 경우(드묾)에도 안전하게 실행합니다.
  setupLateCalTypeToggles();
}

/* ---------- 생년월일 고정(잠금) ---------- */
const BIRTH_LOCK_KEY = 'taekilso_locked_birth';

function getLockedBirth() {
  try { return JSON.parse(accountStore.getItem(BIRTH_LOCK_KEY) || 'null'); }
  catch (e) { return null; }
}

function setCalType(toggleId, type) {
  const toggle = document.getElementById(toggleId);
  if (!toggle) return;
  toggle.querySelectorAll('.ct-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  const leapWrapId = toggleId.replace('CalType', 'LeapWrap');
  const leapWrap = document.getElementById(leapWrapId);
  if (leapWrap) leapWrap.style.display = type === 'lunar' ? 'flex' : 'none';
}

/* prefix: 'birth' | 'fortune' | 'insight' — 각 위치의 select/토글 id 앞부분 */
function applyLockedBirthTo(prefix) {
  const locked = getLockedBirth();
  const yearSel = document.getElementById(prefix + 'Year');
  const monthSel = document.getElementById(prefix + 'Month');
  const daySel = document.getElementById(prefix + 'Day');
  const lockChk = document.getElementById(prefix + 'Lock');
  if (!yearSel || !monthSel || !daySel) return;

  if (locked) {
    setCalType(prefix + 'CalType', locked.calType);
    yearSel.value = locked.year;
    monthSel.value = locked.month;
    // 일(day) 옵션은 연/월이 바뀐 뒤 다시 채워지므로, change 이벤트로 옵션 목록을 먼저 갱신합니다.
    yearSel.dispatchEvent(new Event('change'));
    daySel.value = locked.day;
    daySel.dispatchEvent(new Event('change'));
    const leapChk = document.getElementById(prefix + 'Leap');
    if (leapChk) leapChk.checked = !!locked.isLeap;
    if (lockChk) lockChk.checked = true;
    setInputsDisabled(prefix, true);
  } else if (lockChk) {
    lockChk.checked = false;
    setInputsDisabled(prefix, false);
  }
}

function setInputsDisabled(prefix, disabled) {
  ['Year', 'Month', 'Day'].forEach(part => {
    const el = document.getElementById(prefix + part);
    if (el) el.disabled = disabled;
  });
  const leapChk = document.getElementById(prefix + 'Leap');
  if (leapChk) leapChk.disabled = disabled;
  const toggle = document.getElementById(prefix + 'CalType');
  if (toggle) toggle.style.pointerEvents = disabled ? 'none' : '';
  if (toggle) toggle.style.opacity = disabled ? '.55' : '';
}

/* 고정 체크박스를 조작했을 때: 켜면 지금 입력된 값을 저장하고 잠그고,
   끄면 저장된 값을 지우고 다시 자유롭게 입력할 수 있게 풉니다. */
function onBirthLockToggle(prefix) {
  const lockChk = document.getElementById(prefix + 'Lock');
  if (lockChk.checked) {
    const year = document.getElementById(prefix + 'Year').value;
    const month = document.getElementById(prefix + 'Month').value;
    const day = document.getElementById(prefix + 'Day').value;
    if (!year || !month || !day) {
      showToast('생년월일을 먼저 선택해주세요.');
      lockChk.checked = false;
      return;
    }
    const calType = getCalType(prefix + 'CalType');
    const leapChk = document.getElementById(prefix + 'Leap');
    const isLeap = leapChk ? leapChk.checked : false;
    accountStore.setItem(BIRTH_LOCK_KEY, JSON.stringify({ year, month, day, calType, isLeap }));
    setInputsDisabled(prefix, true);
    showToast('생년월일을 고정했어요. 다른 화면에서도 자동으로 채워져요.');
    ['birth', 'fortune', 'insight'].filter(p => p !== prefix).forEach(applyLockedBirthTo);
  } else {
    accountStore.removeItem(BIRTH_LOCK_KEY);
    setInputsDisabled(prefix, false);
    showToast('고정을 풀었어요. 다른 생년월일을 입력할 수 있어요.');
  }
  if (prefix === 'birth') { syncHiddenDate('birthYear', 'birthMonth', 'birthDay', 'birthDate'); updateSajuPreview(); }
}

function getCalType(toggleId) {
  return document.querySelector(`#${toggleId} .ct-btn.active`).dataset.type;
}

/* 음력 생년월일을 실제 양력 날짜(Date)로 변환. 실패하거나 라이브러리 없으면 null 반환 */
function resolveBirthDate(dateVal, calType, isLeap) {
  if (!dateVal) return null;
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateVal)) { showToast('생년월일 형식을 확인해주세요.'); return null; }
  const [y, m, d] = dateVal.split('-').map(Number);
  if (calType === 'lunar') {
    try {
      if (typeof Lunar === 'undefined') { showToast('음력 변환 기능을 불러오지 못했어요. 새로고침 후 다시 시도해주세요.'); return null; }
      const lunar = Lunar.fromYmd(y, isLeap ? -m : m, d);
      const solar = lunar.getSolar();
      return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
    } catch (err) {
      showToast('음력 날짜 변환에 실패했어요. 날짜를 확인해주세요.');
      return null;
    }
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) {
    showToast('달력에 없는 날짜예요. 생년월일을 확인해주세요.');
    return null;
  }
  return date;
}

/* ---------- LIVE SAJU PREVIEW ---------- */
function updateSajuPreview() {
  const val = document.getElementById('birthDate').value;
  const box = document.getElementById('sajuPreview');
  if (!val) { box.style.display = 'none'; return; }
  const calType = getCalType('birthCalType');
  const isLeap = document.getElementById('birthLeap').checked;
  const d = resolveBirthDate(val, calType, isLeap);
  if (!d) { box.style.display = 'none'; return; }
  const idx = dayGanjiIndex(d);
  const ganji = ganjiName(idx);
  const oh = ohaengOf(idx);
  document.getElementById('sajuGanji').textContent = ganji + '일';
  document.getElementById('sajuOhaeng').innerHTML = `<span class="oh-${oh}"><span class="oh-dot"></span>${oh} 기운</span>`;
  box.style.display = 'flex';
}
document.getElementById('birthDate').addEventListener('change', updateSajuPreview);
document.getElementById('birthLeap').addEventListener('change', updateSajuPreview);

function resetTool() {
  document.getElementById('results').style.display = 'none';
  document.getElementById('dateCards').innerHTML = '';
  const bh = document.getElementById('bestResultHero'); if (bh) bh.style.display = 'none';
  window.scrollTo({ top: document.querySelector('.tool-shell').offsetTop - 100, behavior: 'smooth' });
}
function printResults() {
  window.print();
}

document.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------- HISTORY (localStorage — works on GitHub Pages) ---------- */
const HISTORY_KEY = 'taekilso_history';

function readHistoryStore() {
  try {
    const raw = accountStore.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) { return []; }
}
function saveSearchToHistory(entry) {
  try {
    const list = readHistoryStore();
    list.push({ id: 'h_' + Date.now(), ...entry });
    accountStore.setItem(HISTORY_KEY, JSON.stringify(list));
    updateHistoryCounts();
  } catch (err) { console.error('기록 저장 실패', err); }
}

let currentHistoryTab = 'ai';

function updateHistoryCounts() {
  const searchCount = readHistoryStore().length;
  const vaultCount = getSajuVault().length;
  const aiCount = getAiConversationStore().length;

  const searchEl = document.getElementById('historySearchCount');
  const vaultEl = document.getElementById('historyVaultCount');
  const aiEl = document.getElementById('historyAiCount');
  if (searchEl) searchEl.textContent = String(searchCount);
  if (vaultEl) vaultEl.textContent = String(vaultCount);
  if (aiEl) aiEl.textContent = String(aiCount);

  const clearBtn = document.getElementById('historyClearBtn');
  if (clearBtn) clearBtn.style.display = searchCount ? '' : 'none';
}

function switchHistoryTab(tab) {
  currentHistoryTab = ['ai','search','vault'].includes(tab) ? tab : 'ai';

  const searchPanel = document.getElementById('historySearchPanel');
  const vaultPanel = document.getElementById('historyVaultPanel');
  const aiPanel = document.getElementById('historyAiPanel');

  const searchTab = document.getElementById('historyTabSearch');
  const vaultTab = document.getElementById('historyTabVault');
  const aiTab = document.getElementById('historyTabAi');

  const searchCard = document.getElementById('historySummarySearch');
  const vaultCard = document.getElementById('historySummaryVault');
  const aiCard = document.getElementById('historySummaryAi');

  const map = {
    search: [searchPanel, searchTab, searchCard],
    vault: [vaultPanel, vaultTab, vaultCard],
    ai: [aiPanel, aiTab, aiCard]
  };

  Object.entries(map).forEach(([key, parts]) => {
    const active = key === currentHistoryTab;
    if (parts[0]) parts[0].classList.toggle('active', active);
    if (parts[1]) {
      parts[1].classList.toggle('active', active);
      parts[1].setAttribute('aria-selected', String(active));
    }
    if (parts[2]) parts[2].classList.toggle('active', active);
  });

  if (currentHistoryTab === 'vault') {
    renderSajuVault();
    const authUser = firebaseReady && firebase.auth ? firebase.auth().currentUser : null;
    if (authUser && !authUser.isAnonymous) syncSajuVaultFromCloud(authUser.uid);
  }

  if (currentHistoryTab === 'ai') {
    renderAiConversationHistory();
    syncAiConversationHistoryFromCloud();
  }

  updateHistoryCounts();
}

function clearAllSearchHistory() {
  const entries = readHistoryStore();
  if (!entries.length) return;
  if (!confirm('저장된 검색 기록을 모두 삭제할까요? 사주 보관함은 삭제되지 않습니다.')) return;

  accountStore.removeItem(HISTORY_KEY);
  loadHistory();
  showToast('검색 기록을 모두 삭제했어요.');
}

function loadHistory() {
  const listEl = document.getElementById('historyList');
  const emptyEl = document.getElementById('historyEmpty');
  if (!listEl || !emptyEl) return;

  const entries = readHistoryStore().sort((a, b) => Number(b.savedAt || 0) - Number(a.savedAt || 0));

  if (entries.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    listEl.innerHTML = '';

    entries.forEach((data) => {
      const item = document.createElement('div');
      item.className = 'usecase-item';

      const savedDate = data.savedAt
        ? new Date(data.savedAt).toLocaleDateString('ko-KR')
        : '날짜 없음';

      item.innerHTML = `
        <div>
          <strong style="color:var(--gold-hi); font-family:var(--serif); font-weight:400;">${escapeHtml(data.eventType || '택일')}</strong>
          · 최고 추천일 ${escapeHtml(data.bestDate || '-')}
          <small style="display:block;color:var(--muted-2);font-size:10px;margin-top:5px;">검색일 ${escapeHtml(savedDate)}</small>
        </div>
        <span data-id="${escapeHtml(data.id || '')}" class="hist-delete">삭제</span>
      `;
      listEl.appendChild(item);
    });

    listEl.querySelectorAll('.hist-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        accountStore.setItem(
          HISTORY_KEY,
          JSON.stringify(readHistoryStore().filter(x => x.id !== id))
        );
        loadHistory();
      });
    });
  }

  renderSajuVault();
  updateHistoryCounts();

  // 사용자가 마지막으로 보던 기록 탭을 유지합니다.
  switchHistoryTab(currentHistoryTab);
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const eventType = document.querySelector('.event-opt.active').dataset.val;
  const birthDateVal = document.getElementById('birthDate').value;
  const rangeStartVal = document.getElementById('rangeStart').value;
  const rangeEndVal = document.getElementById('rangeEnd').value;

  if (!birthDateVal || !rangeStartVal || !rangeEndVal) { showToast('생년월일과 기간을 모두 입력해주세요.'); return; }

  const birthDate = resolveBirthDate(birthDateVal, getCalType('birthCalType'), document.getElementById('birthLeap').checked);
  if (!birthDate) return;
  let rangeStart = new Date(rangeStartVal + 'T00:00:00');
  let rangeEnd = new Date(rangeEndVal + 'T00:00:00');
  if (rangeEnd < rangeStart) { showToast('기간의 끝이 시작보다 빠릅니다.'); return; }

  let rangeTruncated = false;
  const spanDays = Math.round((rangeEnd - rangeStart) / 86400000);
  const maxDays = isPremium() ? 365 : 30;
  if (spanDays > maxDays) {
    const capped = new Date(rangeStart);
    capped.setDate(capped.getDate() + maxDays);
    rangeEnd = capped;
    rangeTruncated = true;
    showToast(isPremium() ? '프리미엄은 최대 365일까지 검색할 수 있어요.' : '무료 회원은 최대 30일까지 검색돼요. 프리미엄은 365일까지 검색할 수 있어요.');
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  document.getElementById('loadingLine').style.display = 'flex';
  document.getElementById('results').style.display = 'block';
  document.getElementById('resultsHeading').textContent = '';
  document.getElementById('resultsSub').textContent = '';
  document.getElementById('dateCards').innerHTML = Array(3).fill('<div class="skeleton-card"></div>').join('');

  const userGanjiIdx = dayGanjiIndex(birthDate);
  const userOhaeng = ohaengOf(userGanjiIdx);
  const userGanji = ganjiName(userGanjiIdx);

  const coupleMode = document.getElementById('coupleToggle').checked;
  let partnerOhaeng = null, partnerGanji = null, coupleRelation = null;
  if (coupleMode) {
    const partnerVal = document.getElementById('partnerBirthDate').value;
    if (!partnerVal) { showToast('상대방 생년월일을 입력해주세요.'); btn.disabled = false; document.getElementById('loadingLine').style.display = 'none'; document.getElementById('dateCards').innerHTML = ''; document.getElementById('results').style.display = 'none'; return; }
    const partnerDate = resolveBirthDate(partnerVal, getCalType('partnerCalType'), document.getElementById('partnerLeap').checked);
    if (!partnerDate) { btn.disabled = false; document.getElementById('loadingLine').style.display = 'none'; document.getElementById('results').style.display = 'none'; return; }
    const partnerIdx = dayGanjiIndex(partnerDate);
    partnerOhaeng = ohaengOf(partnerIdx);
    partnerGanji = ganjiName(partnerIdx);
    if (partnerOhaeng === userOhaeng) coupleRelation = '같은 기운';
    else if (GENERATES[userOhaeng] === partnerOhaeng || GENERATES[partnerOhaeng] === userOhaeng) coupleRelation = '상생 관계';
    else if (OVERCOMES[userOhaeng] === partnerOhaeng || OVERCOMES[partnerOhaeng] === userOhaeng) coupleRelation = '상극 관계';
    else coupleRelation = '중립 관계';
  }

  const candidates = [];
  let cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    const idx = dayGanjiIndex(cursor);
    const oh = ohaengOf(idx);
    const userResult = scoreDate(userOhaeng, oh, eventType);
    let score = userResult.score;
    let reasons = userResult.reasons.slice();
    if (coupleMode) {
      const partnerResult = scoreDate(partnerOhaeng, oh, eventType);
      score = (score + partnerResult.score) / 2;
      reasons = reasons.concat(partnerResult.reasons.map(r => '상대방: ' + r));
    }
    const lunarInfo = getLunarInfo(cursor);
    if (lunarInfo && lunarInfo.isSonEomneun) {
      score += (eventType === '이사') ? 2 : 0.8;
      reasons.push('손없는 날');
    }
    /* 같은 오행끼리 완전히 동일한 점수로 보이지 않도록 아주 작은(±0.3 이내) 타이브레이커를 더합니다.
       요일/간지 조합 기반이라 매번 같은 날짜엔 항상 같은 값이 나오고, 좋음/보통/주의 등급은 바뀌지 않아요. */
    const tiebreak = ((idx * 7 + cursor.getDay() * 3) % 11) / 11 * 0.3 - 0.15;
    score += tiebreak;
    candidates.push({ date: new Date(cursor), ganjiIdx: idx, ganji: ganjiName(idx), ganjiHanja: ganjiHanja(idx), ohaeng: oh, score, reasons, lunarInfo });
    cursor.setDate(cursor.getDate() + 1);
  }
  candidates.sort((a, b) => b.score - a.score);
  window.__chronological = candidates.slice().sort((a, b) => a.date - b.date);
  window.__ctx = { eventType, coupleMode, coupleRelation };
  window.__filterMode = 'all';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.mode === 'all'));

  renderResultCards(candidates.slice(0, Math.min(isPremium() ? 20 : 5, candidates.length)), eventType, coupleMode, coupleRelation);
  renderCalendar(window.__chronological, 'all');
  document.getElementById('dayDetail').style.display = 'none';

  const top = candidates.slice(0, Math.min(isPremium() ? 20 : 5, candidates.length));
  document.getElementById('resultsHeading').textContent = `${eventType} 추천 결과`;
  document.getElementById('resultsSub').textContent = coupleMode
    ? `${rangeStart.toLocaleDateString('ko-KR')} ~ ${rangeEnd.toLocaleDateString('ko-KR')} · 두 분의 기운을 함께 비교했습니다.`
    : `${rangeStart.toLocaleDateString('ko-KR')} ~ ${rangeEnd.toLocaleDateString('ko-KR')} · 비교 기준에서 높은 날짜부터 보여드립니다.`;

  const upsellEl = document.getElementById('premiumUpsell');
  if (coupleMode) {
    if (isPremium()) {
      upsellEl.style.display = 'block';
      upsellEl.className = 'premium-report';
      upsellEl.innerHTML = `
        <div class="pr-tag">✦ 프리미엄 상세 리포트</div>
        <p>${buildPremiumCoupleReport(userOhaeng, partnerOhaeng, coupleRelation, eventType)}</p>
      `;
    } else {
      upsellEl.style.display = 'block';
      upsellEl.className = 'premium-locked premium-convert';
      upsellEl.innerHTML = `
        <div class="pr-tag">🔒 여기서부터 정밀 분석</div>
        <p><b>무료 결과는 핵심 후보만 보여드렸어요.</b><br>프리미엄에서는 두 분의 기운을 더 깊이 비교하고, 전체 후보·점수·월별 BEST·상세 이유까지 한 번에 확인할 수 있어요.</p>
        <div class="pp-list" style="margin-top:12px"><div><strong>무료</strong><br>TOP 5 · 기본 점수 · 손없는 날</div><div><strong>30일 프리미엄</strong><br>365일 · TOP 20 · 상세 리포트 · 궁합 택일</div></div>
        <button class="btn btn-primary" style="margin-top:14px;width:100%" data-checkout-action onclick="payPremium()">8,900원으로 30일 전체 결과 보기 →</button>
        <div style="font-size:10px;color:var(--muted-2);margin-top:9px;text-align:center">자동결제 없음 · 30일 후 자동 만료</div>
      `;
    }
  } else {
    if (!isPremium()) {
      upsellEl.style.display = 'block';
      upsellEl.className = 'premium-locked premium-convert';
      upsellEl.innerHTML = `
        <div class="pr-tag">✦ 무료 결과 확인 완료</div>
        <p><b>지금 고른 기간 안에서 더 좋은 날짜가 있는지 확인해보세요.</b><br>무료는 TOP 5를 보여드리고, 프리미엄에서는 최대 365일 전체 후보를 다시 비교해 TOP 20과 월별 BEST까지 확인할 수 있어요.</p>
        <div class="pp-list" style="margin-top:12px"><div><strong>무료로 확인한 것</strong><br>추천 TOP 5 · 일진 · 오행 · 손없는 날</div><div><strong>프리미엄에서 추가</strong><br>365일 · TOP 20 · 상세 이유 · 월별 BEST</div></div>
        <button class="btn btn-primary" style="margin-top:14px;width:100%" data-checkout-action onclick="payPremium()">8,900원으로 30일 전체 분석 열기 →</button>
        <div style="font-size:10px;color:var(--muted-2);margin-top:9px;text-align:center">자동결제 없음 · 결제일로부터 30일</div>
      `;
    } else {
      upsellEl.style.display = 'none';
    }
  }

  if (rangeTruncated) {
    document.getElementById('resultsSub').textContent += ' (무료 30일 · 프리미엄 365일)';
  }

  buildPremiumProgramPanel();

  document.getElementById('loadingLine').style.display = 'none';
  document.getElementById('results').style.display = 'block';
  btn.disabled = false;

  if (top.length > 0) {
    saveSearchToHistory({ eventType, bestDate: top[0].date.toLocaleDateString('ko-KR'), coupleMode, savedAt: Date.now() });
    if (isPremium()) bumpPremiumUsageCount('date_search');
  }
});

function buildPremiumCoupleReport(userOhaeng, partnerOhaeng, relation, eventType) {
  const pieces = {
    '같은 기운': `두 분은 같은 ${userOhaeng} 기운을 공유해서 취향이나 속도가 비슷하게 흘러가는 편이에요. 다만 같은 기운끼리는 서로를 보완하기보다 강화하는 쪽이라, ${eventType} 준비 과정에서 한쪽이 챙기지 못한 부분을 다른 한쪽도 놓치기 쉬우니 체크리스트를 나눠서 관리하면 좋아요.`,
    '상생 관계': `${userOhaeng}와 ${partnerOhaeng}는 서로 북돋우는 상생 관계예요. 한 사람의 추진력이 다른 사람의 기운을 살려주는 조합이라 ${eventType} 준비도 비교적 순조롭게 진행될 가능성이 높아요.`,
    '상극 관계': `${userOhaeng}와 ${partnerOhaeng}는 부딪히는 상극 관계로 나타나요. 이건 "안 맞는다"는 뜻이 아니라, 서로 방식이 뚜렷하게 다르다는 신호예요. ${eventType} 준비 중 의견 차이가 생기면 어느 한쪽 방식으로 몰아가기보다 역할을 나누는 편이 더 매끄러워요.`,
    '중립 관계': `${userOhaeng}와 ${partnerOhaeng}는 특별히 부딪히거나 북돋우지 않는 중립 관계예요. 날짜 자체보다는 두 분이 실제로 맞춰가는 소통 방식이 ${eventType}의 흐름을 더 크게 좌우할 것으로 보여요.`
  };
  return pieces[relation] || pieces['중립 관계'];
}

/* Convert internal recommendation score to a stable 0–100 display score.
   scoreDate() can produce roughly -2 to +4.3 after the optional
   "손없는 날" bonus, so keep the displayed score bounded. */
function to100(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  const MIN_SCORE = -2;
  const MAX_SCORE = 4.3;
  const normalized = (n - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
  return Math.round(Math.max(0, Math.min(1, normalized)) * 100);
}

/* ---------- RESULT CARDS (reusable for filters) ---------- */
/* eventType별 "주의할 점" 문구. 프리미엄 리포트와 1위 추천 카드에서 함께 씁니다. */
/* 사주 계산 결과 화면 하단의 "AI에게 더 물어보기" 버튼입니다.
   홈(AI 상담)으로 이동해서, 방금 확인한 결과를 이어서 물어볼 수 있게 입력창에 채워둡니다. */
function askAiAboutResult(eventType, dateStr) {
  window.__pendingCategoryQuestion = `방금 확인한 ${eventType} 추천 날짜(${dateStr})에 대해 더 자세히 알고 싶어요.`;
  goTo('home');
  setTimeout(() => {
    const panelVisible = document.getElementById('aiChatPanel').style.display === 'flex';
    if (panelVisible) {
      const q = window.__pendingCategoryQuestion;
      window.__pendingCategoryQuestion = null;
      quickAskAiChat(q);
    } else {
      showToast('로그인/생년월일 입력 후 이어서 물어봐드릴게요.');
    }
  }, 150);
}


function updateDateCompareToolbar(){
  const btn = document.getElementById('dateCompareAiBtn');
  const label = document.getElementById('dateCompareCount');
  const count = window.__resultCompareSelections ? window.__resultCompareSelections.size : 0;
  if (label) label.textContent = `${count}개 선택`;
  if (btn) {
    btn.disabled = count < 2;
    btn.textContent = count >= 2 ? `선택한 ${count}개 날짜 AI 비교` : '2~3개 선택 후 AI 비교';
  }
}

function toggleDateCompare(index, checked){
  if (!window.__resultCompareSelections) window.__resultCompareSelections = new Set();

  if (checked) {
    if (window.__resultCompareSelections.size >= 3) {
      const box = document.querySelector(`input[data-date-compare-index="${index}"]`);
      if (box) box.checked = false;
      showToast('날짜는 최대 3개까지 비교할 수 있어요.');
      return;
    }
    window.__resultCompareSelections.add(index);
  } else {
    window.__resultCompareSelections.delete(index);
  }

  updateDateCompareToolbar();
}

function compareSelectedDatesWithAi(){
  const indexes = Array.from(window.__resultCompareSelections || []);
  if (indexes.length < 2) {
    showToast('비교할 날짜를 2개 이상 선택해주세요.');
    return;
  }

  const candidates = indexes
    .map(i => (window.__visibleResultCandidates || [])[i])
    .filter(Boolean)
    .slice(0,3);

  if (candidates.length < 2) {
    showToast('선택한 날짜 정보를 다시 확인해주세요.');
    return;
  }

  const eventType = (window.__ctx && window.__ctx.eventType) || '택일';
  const details = candidates.map((t, idx) => {
    const dateText = `${t.date.getFullYear()}년 ${t.date.getMonth()+1}월 ${t.date.getDate()}일 ${dowNames[t.date.getDay()]}요일`;
    const reasons = (t.reasons || []).slice(0,4).join(', ') || '특이 사유 없음';
    return `${idx+1}) ${dateText} / 종합점수 ${to100(t.score)}점 / 일진 ${t.ganji}(${t.ganjiHanja}) / 오행 ${t.ohaeng} / 계산상 이유: ${reasons}`;
  }).join('\n');

  window.__pendingCategoryQuestion =
    `방금 택일소에서 계산한 ${eventType} 후보 날짜 ${candidates.length}개를 비교해주세요.\n` +
    `아래 값은 실제 택일 계산 결과이므로 이 정보만 근거로 장단점과 우선순위를 설명해주세요.\n\n${details}\n\n` +
    `가장 추천하는 날짜를 1개 고르고, 나머지 날짜와 비교한 이유와 현실적으로 함께 확인할 점도 알려주세요.`;

  goTo('home');
  setTimeout(() => {
    const panel = document.getElementById('aiChatPanel');
    if (panel && panel.style.display === 'flex') {
      const q = window.__pendingCategoryQuestion;
      window.__pendingCategoryQuestion = null;
      quickAskAiChat(q);
    } else {
      handleHomeChatStart();
      showToast('상담할 사주를 선택하면 방금 고른 날짜 비교를 이어서 해드릴게요.');
    }
  }, 120);
}

function cautionTextFor(eventType) {
  if (eventType === '이사') return '실제 이사 일정·방향·계약 조건을 함께 확인하세요.';
  if (eventType === '개업') return '인허가·공사·직원 일정 등 현실 조건을 우선 확인하세요.';
  if (eventType === '결혼식') return '예식장·하객 일정과 양가 일정도 함께 조율하세요.';
  return '계약 조건·서명 시간·실무 일정을 함께 확인하세요.';
}
/* 100점 만점 점수를 5개 별(★)로 환산해 보여줍니다. */
function starRatingHtml(score100) {
  const filled = Math.max(0, Math.min(5, Math.round(score100 / 20)));
  let out = '';
  for (let i = 0; i < 5; i++) out += `<span class="${i < filled ? 'on' : ''}">★</span>`;
  return out;
}
function renderResultCards(top, eventType, coupleMode, coupleRelation) {
  const narratives = top.map(t => generateNarrative(t, eventType, coupleMode, coupleRelation));
  const container = document.getElementById('dateCards');
  container.innerHTML = '';
  window.__visibleResultCandidates = top;
  window.__resultCompareSelections = new Set();
  const hero = document.getElementById('bestResultHero');
  const countEl = document.getElementById('resultCount');
  if (top.length === 0) {
    container.innerHTML = '<div class="empty-note">이 조건에 맞는 날짜가 기간 안에 없어요. 필터를 바꾸거나 기간을 늘려보세요.</div>';
    if (hero) hero.style.display = 'none';
    if (countEl) countEl.textContent = '';
    return;
  }
  const toolbar = document.createElement('div');
  toolbar.className = 'date-compare-toolbar';
  toolbar.innerHTML = `
    <span><b style="color:var(--gold-hi)">후보 날짜 직접 비교</b><br><span id="dateCompareCount">0개 선택</span> · 추천 날짜 중 2~3개를 골라 연우에게 비교해보세요.</span>
    <button id="dateCompareAiBtn" onclick="compareSelectedDatesWithAi()" disabled>2~3개 선택 후 AI 비교</button>
  `;
  container.appendChild(toolbar);

  const best = top[0];
  const bestScore = to100(best.score);
  if (countEl) countEl.textContent = `${top.length}개 추천`;
  if (hero) {
    hero.style.display = 'block';
    const stars = starRatingHtml(bestScore);
    const isWeekend = best.date.getDay() === 0 || best.date.getDay() === 6;
    const isSon = !!(best.lunarInfo && best.lunarInfo.isSonEomneun);
    hero.innerHTML = `
      <div class="best-kicker">🏆 1위 추천 날짜</div>
      <div class="best-main">
        <div>
          <div class="best-date">${best.date.getFullYear()}년 ${best.date.getMonth()+1}월 ${best.date.getDate()}일 ${dowNames[best.date.getDay()]}요일</div>
          <div class="best-meta">일진 ${best.ganji}(${best.ganjiHanja}) · ${best.ohaeng} 기운</div>
        </div>
        <div class="best-score"><strong>${bestScore}</strong><span>종합점수</span></div>
      </div>
      <div class="best-stars">${stars} <span style="color:var(--muted); font-size:11px; letter-spacing:0;">(${bestScore}점)</span></div>
      <div class="best-spec-grid">
        <div><small>오행 궁합</small><b>${best.ohaeng}</b></div>
        <div><small>일진</small><b>${best.ganji}</b></div>
        <div><small>손없는 날</small><b>${isSon ? '해당' : '해당 없음'}</b></div>
        <div><small>주말 여부</small><b>${isWeekend ? '주말' : '평일'}</b></div>
      </div>
      <div class="best-reasons">${(best.reasons.length ? best.reasons.slice(0,3) : ['평이한 기운']).map(r=>`<span>${r}</span>`).join('')}</div>
      <p><b style="color:var(--gold-hi)">추천 이유</b> · ${generateNarrative(best, eventType, coupleMode, coupleRelation)}</p>
      <div class="best-caution"><b>⚠ 주의할 점</b> · ${cautionTextFor(eventType)}</div>
      <button class="btn best-ask-ai-btn" onclick="askAiAboutResult('${eventType}', '${best.date.getFullYear()}년 ${best.date.getMonth()+1}월 ${best.date.getDate()}일')">💬 이 결과, 연우에게 더 물어보기</button>
    `;
  }
  top.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'result-card' + (i === 0 ? ' best' : '');
    card.style.animationDelay = (i * 0.09) + 's';
    const percent = to100(t.score);
    const badgeList = (t.reasons.length ? t.reasons : ['중립']).map(r => `<span class="badge">${r}</span>`).join('');
    window['__result_' + i] = t;
    card.innerHTML = `
      <div class="result-top">
        <div>
          <div class="result-date">${t.date.getMonth()+1}.${t.date.getDate()}</div>
          <div class="result-meta">${dowNames[t.date.getDay()]}요일 · 일진 ${t.ganji}(${t.ganjiHanja}) <span class="oh-${t.ohaeng}"><span class="oh-dot"></span>${t.ohaeng}</span>${t.lunarInfo && t.lunarInfo.isSonEomneun ? ' · <span style="color:var(--gold-hi)">손없는 날</span>' : ''}</div>
        </div>
        <div class="score-ring" style="--p:${percent}"><span>${percent}</span></div>
      </div>
      <div class="badges">${badgeList}</div>
      <div class="result-narrative">${generateNarrative(t, eventType, coupleMode, coupleRelation)}</div>
      <div class="result-actions">
        <label class="mini-action date-compare-check"><input type="checkbox" data-date-compare-index="${i}" onchange="toggleDateCompare(${i}, this.checked)"> 비교 담기</label>
        <span class="mini-action" onclick="buildIcs(window.__result_${i}, '${eventType}')">📅 캘린더 추가</span>
        <span class="mini-action" onclick="shareResult(window.__result_${i}, '${eventType}')">공유하기</span>
        <span class="mini-action" onclick="window.print()">PDF 저장</span>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ---------- CALENDAR HEATMAP ---------- */
function scoreClass(t) {
  if (t.score >= 1.5) return 'good';
  if (t.score < 0) return 'warn';
  return 'mid';
}
function renderCalendar(chronological, filterMode) {
  const wrap = document.getElementById('calendarWrap');
  wrap.innerHTML = '';
  if (chronological.length === 0) return;

  const byMonth = {};
  chronological.forEach(t => {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(t);
  });

  Object.keys(byMonth).forEach(key => {
    const list = byMonth[key];
    const first = list[0].date;
    const monthBlock = document.createElement('div');
    monthBlock.className = 'cal-month';
    const title = document.createElement('div');
    title.className = 'cal-month-title';
    title.textContent = `${first.getFullYear()}년 ${first.getMonth()+1}월`;
    monthBlock.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'cal-grid';
    ['일','월','화','수','목','금','토'].forEach(d => {
      const dow = document.createElement('div');
      dow.className = 'cal-dow';
      dow.textContent = d;
      grid.appendChild(dow);
    });

    const leadingBlanks = first.getDay();
    for (let i = 0; i < leadingBlanks; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-cell empty';
      grid.appendChild(blank);
    }

    list.forEach(t => {
      const cell = document.createElement('div');
      const dow = t.date.getDay();
      const matchesFilter = filterMode === 'all' || (filterMode === 'weekend' && (dow === 0 || dow === 6)) || (filterMode === 'weekday' && dow >= 1 && dow <= 5);
      const cls = scoreClass(t);
      const bg = cls === 'good' ? 'rgba(215,180,106,.30)' : cls === 'warn' ? 'rgba(201,131,106,.26)' : 'rgba(255,255,255,.06)';
      cell.className = 'cal-cell' + (matchesFilter ? '' : ' dim');
      cell.style.background = bg;
      cell.dataset.key = `${t.date.getFullYear()}-${t.date.getMonth()}-${t.date.getDate()}`;
      cell.innerHTML = `${t.date.getDate()}${t.lunarInfo && t.lunarInfo.isSonEomneun ? '<span class="cal-dot"></span>' : ''}`;
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.addEventListener('click', () => showDayDetail(t));
      cell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDayDetail(t); } });
      grid.appendChild(cell);
    });

    monthBlock.appendChild(grid);
    wrap.appendChild(monthBlock);
  });
}

function showDayDetail(t) {
  document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
  const key = `${t.date.getFullYear()}-${t.date.getMonth()}-${t.date.getDate()}`;
  const cell = document.querySelector(`.cal-cell[data-key="${key}"]`);
  if (cell) cell.classList.add('selected');

  const ctx = window.__ctx || {};
  const panel = document.getElementById('dayDetail');
  const badgeList = (t.reasons.length ? t.reasons : ['중립']).map(r => `<span class="badge">${r}</span>`).join('');
  window.__dayDetailResult = t;
  panel.innerHTML = `
    <div class="result-top">
      <div>
        <div class="result-date">${t.date.getFullYear()}.${t.date.getMonth()+1}.${t.date.getDate()}</div>
        <div class="result-meta">${dowNames[t.date.getDay()]}요일 · 일진 ${t.ganji}(${t.ganjiHanja}) <span class="oh-${t.ohaeng}"><span class="oh-dot"></span>${t.ohaeng}</span>${t.lunarInfo && t.lunarInfo.isSonEomneun ? ' · <span style="color:var(--gold-hi)">손없는 날</span>' : ''}</div>
      </div>
    </div>
    <div class="badges">${badgeList}</div>
    <div class="result-narrative">${generateNarrative(t, ctx.eventType, ctx.coupleMode, ctx.coupleRelation)}</div>
    <div class="result-actions">
      <span class="mini-action" onclick="buildIcs(window.__dayDetailResult, '${ctx.eventType}')">📅 캘린더 추가</span>
      <span class="mini-action" onclick="shareResult(window.__dayDetailResult, '${ctx.eventType}')">공유하기</span>
    </div>
  `;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function applyDowFilter(mode) {
  if (!window.__chronological) return;
  window.__filterMode = mode;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.mode === mode));

  const filtered = window.__chronological.filter(t => {
    const dow = t.date.getDay();
    if (mode === 'weekend') return dow === 0 || dow === 6;
    if (mode === 'weekday') return dow >= 1 && dow <= 5;
    return true;
  }).slice().sort((a, b) => b.score - a.score).slice(0, 5);

  const ctx = window.__ctx || {};
  renderResultCards(filtered, ctx.eventType, ctx.coupleMode, ctx.coupleRelation);
  renderCalendar(window.__chronological, mode);
  document.getElementById('dayDetail').style.display = 'none';
}
