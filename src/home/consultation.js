function goHomeSection(id){
  goTo('home');
  setTimeout(function(){
    const el=document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
  },60);
}
/* ---------- AI 사주 상담 ---------- */
const AI_CONVERSATION_KEY = 'taekilso_ai_conversations_v1';
const AI_ACTIVE_SESSION_KEY = 'taekilso_ai_active_session_v1';
window.__aiConversationId = null;

function setActiveAiSession(id){
  if (!id) {
    accountStore.removeItem(AI_ACTIVE_SESSION_KEY);
    return;
  }
  const ownerKey = typeof getCurrentUserKey === 'function' ? getCurrentUserKey() : null;
  accountStore.setItem(AI_ACTIVE_SESSION_KEY, JSON.stringify({
    id: String(id),
    ownerKey: ownerKey || null,
    updatedAt: Date.now()
  }));
}

function getActiveAiSession(){
  try {
    const raw = accountStore.getItem(AI_ACTIVE_SESSION_KEY);
    const rec = raw ? JSON.parse(raw) : null;
    if (!rec || !rec.id) return null;
    // 자동복원은 최근 7일 상담만. 오래된 상담은 기록 탭에서 수동으로 이어갈 수 있습니다.
    if (Date.now() - Number(rec.updatedAt || 0) > 7 * 24 * 60 * 60 * 1000) {
      accountStore.removeItem(AI_ACTIVE_SESSION_KEY);
      return null;
    }
    const nowOwner = typeof getCurrentUserKey === 'function' ? getCurrentUserKey() : null;
    if (!accountStore.owner() || rec.ownerKey !== accountStore.owner()) return null;
    return rec;
  } catch (e) {
    return null;
  }
}

function makeAiConversationId(){
  return 'ac_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function getAiConversationStore(){
  try {
    const raw = accountStore.getItem(AI_CONVERSATION_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function setAiConversationStore(list){
  const clean = Array.isArray(list) ? list.slice(0,30) : [];
  accountStore.setItem(AI_CONVERSATION_KEY, JSON.stringify(clean));
  updateHistoryCounts();
}

function sanitizeAiConversationSubject(s){
  if (!s || typeof s !== 'object') return null;
  return {
    name: String(s.name || '').slice(0,30),
    relation: String(s.relation || '').slice(0,30),
    summary: String(s.summary || '').slice(0,6000),
    profile: s.profile || {},
    data: s.data || {}
  };
}

function buildCurrentAiConversationRecord(){
  if (!window.__aiConversationId || !Array.isArray(window.__aiChatHistory) || !window.__aiChatHistory.length) return null;

  const messages = window.__aiChatHistory
    .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-20)
    .map(m => {
      const evidence = m.role === 'assistant' && window.TaekilExperienceCore?.normalizeEvidence(m.evidence);
      return { role:m.role, content:String(m.content || '').slice(0,4000), ...(evidence?.length ? {evidence} : {}) };
    });

  const subjects = (window.__aiChatSubjects || [])
    .slice(0,3)
    .map(sanitizeAiConversationSubject)
    .filter(Boolean);

  const firstUser = messages.find(m => m.role === 'user');
  const titleBase = firstUser ? firstUser.content : 'AI 사주 상담';
  const now = Date.now();
  const existing = getAiConversationStore().find(x => x.id === window.__aiConversationId);

  return {
    id: window.__aiConversationId,
    consultantId: window.TaekilConsultationPersonas?.get(window.__aiConsultantId).id || 'yeonwoo',
    title: titleBase.length > 34 ? titleBase.slice(0,34) + '…' : titleBase,
    subjects,
    messages,
    createdAtMs: existing ? Number(existing.createdAtMs || now) : now,
    updatedAtMs: now,
    preview: messages.length ? String(messages[messages.length-1].content || '').slice(0,120) : ''
  };
}

async function saveCurrentAiConversation(){
  const record = buildCurrentAiConversationRecord();
  if (!record) return;

  const local = getAiConversationStore().filter(x => x.id !== record.id);
  local.unshift(record);
  setAiConversationStore(local);
  setActiveAiSession(record.id);

  const authUser = firebaseReady && firebase.auth ? firebase.auth().currentUser : null;
  if (!db || !authUser || authUser.isAnonymous) return;

  try {
    await db.collection('users').doc(authUser.uid)
      .collection('aiConversations').doc(record.id)
      .set(record, { merge:true });
  } catch (err) {
    console.warn('AI 상담 기록 서버 저장 실패', err);
  }
}

async function syncAiConversationHistoryFromCloud(){
  const accountToken = accountStore.snapshot();
  const authUser = firebaseReady && firebase.auth ? firebase.auth().currentUser : null;
  if (!db || !authUser || authUser.isAnonymous) {
    renderAiConversationHistory();
    return;
  }

  try {
    const snap = await db.collection('users').doc(authUser.uid)
      .collection('aiConversations')
      .orderBy('updatedAtMs','desc')
      .limit(30)
      .get();

    if (!accountStore.current(accountToken)) return;
    const merged = new Map();
    [...getAiConversationStore(), ...snap.docs.map(d => ({...d.data(), id:d.id}))].forEach(rec => {
      if (!rec || !rec.id) return;
      const prev = merged.get(rec.id);
      if (!prev || Number(rec.updatedAtMs || 0) >= Number(prev.updatedAtMs || 0)) merged.set(rec.id, rec);
    });

    const list = Array.from(merged.values())
      .sort((a,b) => Number(b.updatedAtMs || 0) - Number(a.updatedAtMs || 0))
      .slice(0,30);
    setAiConversationStore(list);
    renderAiConversationHistory();
  } catch (err) {
    console.warn('AI 상담 기록 동기화 실패', err);
    renderAiConversationHistory();
  }
}

function renderAiConversationHistory(){
  const host = document.getElementById('aiConversationHistoryList');
  const empty = document.getElementById('aiConversationHistoryEmpty');
  if (!host) return;

  const list = getAiConversationStore()
    .sort((a,b) => Number(b.updatedAtMs || 0) - Number(a.updatedAtMs || 0));

  if (!list.length) {
    host.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  host.innerHTML = list.map(rec => {
    const consultant = window.TaekilConsultationPersonas?.get(rec.consultantId);
    const consultantName = consultant?.name || '연우';
    const names = (rec.subjects || []).map(s => s.name).filter(Boolean).join(' · ');
    const dt = rec.updatedAtMs ? new Date(rec.updatedAtMs).toLocaleString('ko-KR') : '';
    return `<div class="ai-history-item" data-history-advisor="${escapeHtml(consultant?.id || 'yeonwoo')}">
      <div class="ai-history-top">
        <div>
          <b class="ai-history-consultant">${escapeHtml(consultantName)} 상담</b>
          <div class="ai-history-title">${escapeHtml(rec.title || 'AI 사주 상담')}</div>
          <div class="ai-history-meta">${escapeHtml(names || '상담 대상')} · ${escapeHtml(dt)}</div>
        </div>
      </div>
      <div class="ai-history-preview">${escapeHtml(rec.preview || '')}</div>
      <div class="ai-history-actions">
        <button onclick="resumeAiConversation('${rec.id}')">이어서 상담</button>
        <button onclick="deleteAiConversation('${rec.id}')">삭제</button>
      </div>
    </div>`;
  }).join('');
}

function resumeAiConversation(id){
  const accountToken = accountStore.snapshot();
  if (!accountToken.owner) { openAuthModal(); return; }
  const rec = getAiConversationStore().find(x => x.id === id);
  if (!rec) { showToast('상담 기록을 찾지 못했어요.'); return; }

  if (window.__aiConversationId !== rec.id) window.resetAiComposer?.();
  window.__aiConversationId = rec.id;
  window.__aiConsultantId = window.TaekilConsultationPersonas?.get(rec.consultantId).id || 'yeonwoo';
  setActiveAiSession(rec.id);
  window.__aiChatSubjects = Array.isArray(rec.subjects) ? rec.subjects.slice(0,3) : [];
  window.__aiChatProfile = window.__aiChatSubjects[0]?.profile || null;
  window.__aiChatSaju = window.__aiChatSubjects[0]?.summary || '';
  window.__aiChatHistory = Array.isArray(rec.messages) ? rec.messages.slice(-20) : [];

  goTo('home');
  setTimeout(() => {
    if (!accountStore.current(accountToken) || window.__aiConversationId !== rec.id) return;
    const intro = document.getElementById('homeIntroOverlay');
    const setup = document.getElementById('aiChatSetup');
    const panel = document.getElementById('aiChatPanel');
    const win = document.getElementById('aiChatWindow');
    if (intro) intro.style.display = 'none';
    if (setup) setup.style.display = 'none';
    if (panel) panel.style.display = 'flex';
    if (win) {
      win.innerHTML = '';
      appendAiChatMessage('system-note', '저장한 상담을 불러왔어요. 이전 대화에 이어서 질문할 수 있어요.');
      window.__aiChatHistory.forEach(m => appendAiChatMessage(m.role, m.content, {scroll:'none',evidence:m.evidence}));
      scrollAiChatToBottom(win);
    }
    const quick = document.getElementById('aiChatQuickActions');
    if (quick) quick.style.display = 'none';
    updateAiChatStatus(null, null, isPremium());
    window.refreshAiChatPremiumStatus?.();
    /* CHECKOUT_START */
    void refreshQuestionCreditUI(accountToken.owner);
    /* CHECKOUT_END */
  }, 80);
}


function restoreActiveAiConversation(options){
  const accountToken = accountStore.snapshot();
  const opts = options || {};
  const active = getActiveAiSession();
  if (!active || !active.id) return false;

  const rec = getAiConversationStore().find(x => x.id === active.id);
  if (!rec || !Array.isArray(rec.messages) || !rec.messages.length) return false;

  const nowOwner = typeof getCurrentUserKey === 'function' ? getCurrentUserKey() : null;
  if (active.ownerKey && nowOwner && active.ownerKey !== nowOwner) return false;

  if (window.__aiConversationId !== rec.id) window.resetAiComposer?.();
  window.__aiConversationId = rec.id;
  window.__aiConsultantId = window.TaekilConsultationPersonas?.get(rec.consultantId).id || 'yeonwoo';
  window.__aiChatSubjects = Array.isArray(rec.subjects) ? rec.subjects.slice(0,3) : [];
  window.__aiChatProfile = window.__aiChatSubjects[0]?.profile || null;
  window.__aiChatSaju = window.__aiChatSubjects[0]?.summary || '';
  window.__aiChatHistory = Array.isArray(rec.messages) ? rec.messages.slice(-20) : [];

  goTo('home');

  setTimeout(() => {
    if (!accountStore.current(accountToken) || window.__aiConversationId !== rec.id) return;
    const intro = document.getElementById('homeIntroOverlay');
    const setup = document.getElementById('aiChatSetup');
    const panel = document.getElementById('aiChatPanel');
    const win = document.getElementById('aiChatWindow');
    if (intro) intro.style.display = 'none';
    if (setup) setup.style.display = 'none';
    if (panel) panel.style.display = 'flex';

    if (win) {
      win.innerHTML = '';
      if (!opts.silent) {
        appendAiChatMessage('system-note', opts.note || '이전 상담을 불러왔어요. 그대로 이어서 질문할 수 있어요.');
      }
      window.__aiChatHistory.forEach(m => appendAiChatMessage(m.role, m.content, {scroll:'none',evidence:m.evidence}));
      scrollAiChatToBottom(win);
    }

    const quick = document.getElementById('aiChatQuickActions');
    if (quick) quick.style.display = 'none';

    /* CHECKOUT_START */
    void refreshQuestionCreditUI(accountToken.owner);
    /* CHECKOUT_END */
    // 결제 직후라면 저장된 잠금 질문도 이어서 전송합니다.
    if (opts.resumePendingQuestion && getPendingPaidAiQuestion()) {
      setTimeout(() => { if (accountStore.current(accountToken)) resumePendingPaidAiQuestion(); }, 300);
    }
  }, 80);

  setActiveAiSession(rec.id);
  return true;
}

// 일반 접속/새로고침에서는 이전 AI 상담을 자동으로 열지 않습니다.
// 결제 완료 후 돌아온 경우에는 아래 결제 확인 흐름에서만
// restoreActiveAiConversation()을 호출해 결제 전 상담을 이어갑니다.

async function deleteAiConversation(id){
  if (!confirm('이 AI 상담 기록을 삭제할까요?')) return;
  const active = getActiveAiSession();
  if (active && active.id === id) setActiveAiSession(null);
  setAiConversationStore(getAiConversationStore().filter(x => x.id !== id));
  window.TaekilExperience?.removeConversation(id);
  renderAiConversationHistory();

  const authUser = firebaseReady && firebase.auth ? firebase.auth().currentUser : null;
  if (db && authUser && !authUser.isAnonymous) {
    try {
      await db.collection('users').doc(authUser.uid).collection('aiConversations').doc(id).delete();
    } catch (err) {
      console.warn('AI 상담 기록 서버 삭제 실패', err);
    }
  }
}

window.__aiChatHistory = [];
window.__aiChatSaju = null;
window.__aiChatProfile = null;

function fillAiChatDateSelects(){
  const y=document.getElementById('aiChatYear'),m=document.getElementById('aiChatMonth'),d=document.getElementById('aiChatDay');
  const h=document.getElementById('aiChatHour');
  if(!y||!m||!d||y.options.length) return;
  for (const [select, label] of [[y,'출생 연도'], [m,'월'], [d,'일']]) {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = label;
    select.appendChild(placeholder);
  }
  const now=new Date();
  for(let yy=1940;yy<=now.getFullYear();yy++){const o=document.createElement('option');o.value=yy;o.textContent=yy+'년';y.appendChild(o);}
  for(let mm=1;mm<=12;mm++){const o=document.createElement('option');o.value=mm;o.textContent=mm+'월';m.appendChild(o);}
  for(let dd=1;dd<=31;dd++){const o=document.createElement('option');o.value=dd;o.textContent=dd+'일';d.appendChild(o);}
  if(h && !h.options.length){
    const unknown=document.createElement('option'); unknown.value='unknown'; unknown.textContent='시간 모름'; h.appendChild(unknown);
    for(let hh=0;hh<24;hh++){const o=document.createElement('option');o.value=hh;o.textContent=String(hh).padStart(2,'0')+'시';h.appendChild(o);}
    h.value='unknown';
  }
  y.value = m.value = d.value = '';
}

function getAiEightCharData(birthDate, hourValue){
  const result = { pillars:{}, fiveElements:{}, tenGods:{}, hiddenStems:{} };
  try {
    if (typeof Solar === 'undefined' || !Solar.fromYmdHms) return result;
    const hasHour = hourValue !== 'unknown' && hourValue !== '' && Number.isFinite(Number(hourValue));
    const hh = hasHour ? Number(hourValue) : 12;
    const solar = Solar.fromYmdHms(birthDate.getFullYear(), birthDate.getMonth()+1, birthDate.getDate(), hh, 0, 0);
    const lunar = solar.getLunar();
    const ec = lunar && lunar.getEightChar ? lunar.getEightChar() : null;
    if (!ec) return result;

    const getters = [
      ['year','getYear'],['month','getMonth'],['day','getDay'],['hour','getTime'],
    ];
    getters.forEach(([key,fn])=>{
      if (key==='hour' && !hasHour) return;
      if (typeof ec[fn] === 'function') result.pillars[key] = ec[fn]();
    });
    const ohGetters = [
      ['year','getYearWuXing'],['month','getMonthWuXing'],['day','getDayWuXing'],['hour','getTimeWuXing'],
    ];
    ohGetters.forEach(([key,fn])=>{
      if (key==='hour' && !hasHour) return;
      if (typeof ec[fn] === 'function') result.fiveElements[key] = ec[fn]();
    });
    const ssGetters = [
      ['yearGan','getYearShiShenGan'],['monthGan','getMonthShiShenGan'],['dayGan','getDayShiShenGan'],['hourGan','getTimeShiShenGan'],
      ['yearZhi','getYearShiShenZhi'],['monthZhi','getMonthShiShenZhi'],['dayZhi','getDayShiShenZhi'],['hourZhi','getTimeShiShenZhi']
    ];
    ssGetters.forEach(([key,fn])=>{
      if (key.startsWith('hour') && !hasHour) return;
      if (typeof ec[fn] === 'function') result.tenGods[key] = ec[fn]();
    });
    const hideGetters = [
      ['year','getYearHideGan'],['month','getMonthHideGan'],['day','getDayHideGan'],['hour','getTimeHideGan']
    ];
    hideGetters.forEach(([key,fn])=>{
      if (key==='hour' && !hasHour) return;
      if (typeof ec[fn] === 'function') result.hiddenStems[key] = ec[fn]();
    });
    if (lunar && typeof lunar.getYear === 'function') result.lunar = `${lunar.getYear()}년 ${lunar.getMonth()}월 ${lunar.getDay()}일`;
    result.hasHour = hasHour;
  } catch (e) {
    console.warn('[ai-chat] 사주 4주 계산 보강 실패', e);
  }
  return result;
}

function buildAiChatSajuSummary({y,m,d,calType,hourValue,gender,birth}){
  const idx = dayGanjiIndex(birth), oh = ohaengOf(idx);
  const data = getAiEightCharData(birth, hourValue);
  const lines = [
    `생년월일: ${y}년 ${m}월 ${d}일 (${calType === 'lunar' ? '음력' : '양력'})`,
    `출생시간: ${hourValue === 'unknown' ? '모름' : String(hourValue).padStart(2,'0') + '시'}`,
    `성별: ${gender === 'female' ? '여성' : gender === 'male' ? '남성' : '선택 안 함'}`,
    `일진 기준 일주: ${ganjiFull(idx)}`,
    `일주 기준 핵심 오행: ${oh} 기운`
  ];
  if (data.lunar) lines.push(`변환 음력 날짜: ${data.lunar}`);
  if (Object.keys(data.pillars).length) {
    lines.push(`사주 팔자(계산 라이브러리 결과): ${Object.entries(data.pillars).map(([k,v])=>`${k}=${v}`).join(', ')}`);
  }
  if (Object.keys(data.fiveElements).length) lines.push(`주별 오행: ${Object.entries(data.fiveElements).map(([k,v])=>`${k}=${v}`).join(', ')}`);
  if (Object.keys(data.tenGods).length) lines.push(`십신 정보(계산 라이브러리 제공 범위): ${Object.entries(data.tenGods).map(([k,v])=>`${k}=${v}`).join(', ')}`);
  if (Object.keys(data.hiddenStems).length) lines.push(`지장간 정보(계산 라이브러리 제공 범위): ${Object.entries(data.hiddenStems).map(([k,v])=>`${k}=${v}`).join(', ')}`);
  lines.push('주의: 위 정보 중 실제 계산 라이브러리가 제공한 값만 사용하고, 전달되지 않은 대운·세운·용신 등은 임의로 추정하지 않습니다.');
  return { text: lines.join('\n'), data };
}

/* 채팅 안 택일: 기존 택일 계산식을 그대로 사용해 후보 날짜를 즉시 보여줍니다. */
function getAiChatPrimaryOhaeng(){
  const p=window.__aiChatProfile;
  if(!p) return null;
  try{
    const birth=p.birth ? new Date(p.birth) : resolveBirthDate(`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`,p.calType||'solar',!!p.isLeap);
    return birth ? ohaengOf(dayGanjiIndex(birth)) : null;
  }catch(e){return null;}
}
function getAiChatPartnerOhaeng(){
  const s=(window.__aiChatSubjects||[])[1];
  const p=s&&s.profile;
  if(!p) return null;
  try{
    const birth=p.birth ? new Date(p.birth) : resolveBirthDate(`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`,p.calType||'solar',!!p.isLeap);
    return birth ? ohaengOf(dayGanjiIndex(birth)) : null;
  }catch(e){return null;}
}
function buildTaekilCandidate(date,eventType,userOhaeng,partnerOhaeng){
  if(!userOhaeng) return null;
  const idx=dayGanjiIndex(date), oh=ohaengOf(idx);
  const ur=scoreDate(userOhaeng,oh,eventType);
  let score=ur.score, reasons=ur.reasons.slice();
  if(partnerOhaeng){
    const pr=scoreDate(partnerOhaeng,oh,eventType);
    score=(score+pr.score)/2;
    reasons=reasons.concat(pr.reasons.map(r=>'상대방: '+r));
  }
  const lunarInfo=getLunarInfo(date);
  if(lunarInfo&&lunarInfo.isSonEomneun){score+=(eventType==='이사'?2:.8);reasons.push('손없는 날');}
  const tiebreak=((idx*7+date.getDay()*3)%11)/11*.3-.15;
  score+=tiebreak;
  return {date:new Date(date),ganjiIdx:idx,ganji:ganjiName(idx),ganjiHanja:ganjiHanja(idx),ohaeng:oh,score,reasons,lunarInfo};
}
function buildAiInlineCandidate(date,eventType){
  const userOhaeng=getAiChatPrimaryOhaeng();
  if(!userOhaeng)return null;
  return buildTaekilCandidate(date,eventType,userOhaeng,getAiChatPartnerOhaeng());
}
function getAiInlineTaekilTop(eventType,startDate,endDate,limit=3){
  const arr=[]; let cur=new Date(startDate); cur.setHours(0,0,0,0);
  const end=new Date(endDate); end.setHours(0,0,0,0);
  while(cur<=end){const c=buildAiInlineCandidate(cur,eventType); if(c)arr.push(c); cur.setDate(cur.getDate()+1);}
  arr.sort((a,b)=>b.score-a.score);
  return arr.slice(0,limit);
}
function aiInlineDateText(t){return `${t.date.getFullYear()}년 ${t.date.getMonth()+1}월 ${t.date.getDate()}일 (${dowNames[t.date.getDay()]})`;}
function renderAiInlineTaekil(eventType,candidates,sourceLabel){
  const win=document.getElementById('aiChatWindow'); if(!win||!candidates||!candidates.length)return false;
  const old=win.querySelector('.ai-inline-taekil[data-live="1"]'); if(old)old.remove();
  const wrap=document.createElement('div'); wrap.className='ai-inline-taekil'; wrap.dataset.live='1';
  const rangeLabel=sourceLabel||'앞으로 30일 중 계산 결과가 높은 날짜';
  wrap.innerHTML=`<div class="ai-inline-taekil-head"><small>연우 · 실제 택일 계산</small><b>${escapeHtml(eventType)} 추천 날짜</b><span>${escapeHtml(rangeLabel)}를 사주 기준으로 비교했어요.</span></div><div class="ai-inline-date-list"></div><div class="ai-inline-taekil-actions"><button class="primary" type="button">이 날짜들 연우에게 비교해줘</button><button type="button">기간 직접 정해서 더 찾아보기</button></div>`;
  const list=wrap.querySelector('.ai-inline-date-list');
  candidates.forEach((t,i)=>{
    const card=document.createElement('div'); card.className='ai-inline-date-card'+(i===0?' best':'');
    const reason=(t.reasons||[]).slice(0,2).join(' · ')||'무난한 흐름';
    card.innerHTML=`<div class="ai-inline-date-top"><b>${i===0?'👑 ':''}${escapeHtml(aiInlineDateText(t))}</b>${i===0?'<em>가장 추천</em>':''}</div><div class="ai-inline-date-meta">${to100(t.score)}점 · ${escapeHtml(t.ganji)}(${escapeHtml(t.ganjiHanja)}) · ${escapeHtml(t.ohaeng)} 기운</div><p>${escapeHtml(reason)}</p>`;
    list.appendChild(card);
  });
  const btns=wrap.querySelectorAll('.ai-inline-taekil-actions button');
  btns[0].onclick=()=>{
    const details=candidates.map((t,i)=>`${i+1}) ${aiInlineDateText(t)} / ${to100(t.score)}점 / 일진 ${t.ganji}(${t.ganjiHanja}) / 오행 ${t.ohaeng} / 이유 ${(t.reasons||[]).slice(0,4).join(', ')||'특이 사유 없음'}`).join('\n');
    quickAskAiChat(`방금 택일소에서 실제 계산한 ${eventType} 후보를 비교해주세요. 아래 계산값을 기준으로 가장 추천하는 날짜 1개와 각 날짜의 특징·주의점을 설명해주세요.\n\n${details}`);
  };
  btns[1].onclick=()=>goTo('tool',eventType);
  win.appendChild(wrap); scrollAiChatToBottom(win); return true;
}
function openAiInlineTaekil(eventType){
  if(!window.__aiChatProfile){showToast('먼저 상담할 사주를 선택해주세요.');return;}
  const start=new Date(); start.setDate(start.getDate()+1);
  const end=new Date(start); end.setDate(end.getDate()+29);
  const top=getAiInlineTaekilTop(eventType,start,end,3);
  if(!top.length){showToast('날짜 후보를 계산하지 못했어요.');return;}
  trackAiFunnel('inline_taekil_open',{eventType});
  appendAiChatMessage('assistant',`${eventType}이라면 먼저 가까운 30일 안에서 사주 흐름이 잘 맞는 날짜를 골라볼게요. 아래는 택일소 계산식으로 추린 후보예요.`);
  renderAiInlineTaekil(eventType,top,'가까운 30일');
}
function parseAiSpecificDates(message){
  const s=String(message||'');
  const eventType=/결혼|예식/.test(s)?'결혼식':/이사/.test(s)?'이사':/개업|창업/.test(s)?'개업':/계약|서명/.test(s)?'계약체결':'';
  if(!eventType)return null;
  const ym=s.match(/(20\d{2})\s*년\s*(1[0-2]|0?[1-9])\s*월/);
  if(!ym)return null;
  const y=+ym[1],m=+ym[2];
  const tail=s.slice(ym.index+ym[0].length);
  const days=[...tail.matchAll(/(?:^|[\s,·\/]|그리고|와|과)(3[01]|[12]?\d)\s*일/g)].map(x=>+x[1]).filter((d,i,a)=>d>=1&&d<=31&&a.indexOf(d)===i);
  if(days.length<2)return null;
  const dates=days.map(d=>new Date(y,m-1,d)).filter(d=>d.getFullYear()===y&&d.getMonth()===m-1);
  if(dates.length<2)return null;
  return {eventType,dates};
}
function appendAiInlineSpecificDateComparison(userMessage){
  const parsed=parseAiSpecificDates(userMessage); if(!parsed||!window.__aiChatProfile)return false;
  const candidates=parsed.dates.map(d=>buildAiInlineCandidate(d,parsed.eventType)).filter(Boolean).sort((a,b)=>b.score-a.score);
  if(candidates.length<2)return false;
  trackAiFunnel('inline_specific_dates_compare',{eventType:parsed.eventType,count:candidates.length});
  return renderAiInlineTaekil(parsed.eventType,candidates,`${parsed.dates[0].getFullYear()}년 ${parsed.dates[0].getMonth()+1}월 지정 후보 ${candidates.length}개`);
}

/* 사용자 질문에 날짜 선택이 포함되면 실제 택일 기능으로 연결합니다. */
function appendAiChatServiceCta(userMessage) {
  const map = [
    { key: '결혼', label: '💍 결혼 택일 바로 알아보기', event: '결혼식' },
    { key: '이사', label: '🏠 이사 택일 바로 알아보기', event: '이사' },
    { key: '개업', label: '🏮 개업 택일 바로 알아보기', event: '개업' },
    { key: '계약', label: '📜 계약 택일 바로 알아보기', event: '계약체결' },
  ];
  const matched = map.filter(m => userMessage.includes(m.key));
  if (!matched.length) return;
  const win = document.getElementById('aiChatWindow');
  const wrap = document.createElement('div');
  wrap.className = 'ai-chat-cta-row';
  matched.forEach(m => {
    const btn = document.createElement('button');
    btn.textContent = m.label;
    btn.onclick = () => goTo('tool', m.event);
    wrap.appendChild(btn);
  });
  win.appendChild(wrap);
  // 이 버튼은 답변 바로 아래 붙는 보조 요소라, 여기서 다시 스크롤을 내리지 않습니다.
  // (답변은 위에서 이미 "시작 지점"에 맞춰 스크롤해 둔 상태를 유지합니다.)
}

/* 무료 질문을 다 쓰면 질문권과 30일 신년운세를 안내합니다. */
function appendQuestionPackOffers() {
  const win = document.getElementById('aiChatWindow');
  if (!win) return;

  win.querySelectorAll('.ai-chat-offer-grid').forEach(el => el.remove());

  const pending = getPendingPaidAiQuestion();
  const wrap = document.createElement('div');
  wrap.className = 'ai-chat-offer-grid ai-chat-conversion-chooser';

  wrap.innerHTML = `
    <div class="ai-paywall-head">
      <div class="ai-paywall-kicker">상담 계속하기</div>
      <b>상담을 이어가세요.</b>
      <span data-checkout-action>${pending ? '결제가 확인되면 방금 선택한 질문을 이어가요.' : '이어서 질문할 이용권을 골라 주세요.'}</span>
    </div>

    <button type="button" class="ai-chat-offer-card ai-offer-quick" data-checkout-action data-ai-buy-pack="ai_question_pack_5">
      <div class="ai-offer-copy">
        <small>가볍게 더 물어볼 때</small>
        <b>AI 질문권 5개</b>
        <span>질문 1개당 380원</span>
      </div>
      <div class="ai-offer-price"><em>1,900원</em></div>
    </button>

    <button type="button" class="ai-chat-offer-card" data-checkout-action data-ai-buy-pack="ai_question_pack_10">
      <div class="ai-offer-copy">
        <b>AI 질문권 10개</b>
        <span>질문 1개당 250원</span>
      </div>
      <div class="ai-offer-price"><em>2,500원</em></div>
    </button>
    <p class="ai-offer-savings" data-checkout-action>10개권은 5개권 두 번 구매보다 약 34% 저렴해요.</p>

    <button type="button" class="ai-chat-offer-card ai-chat-offer-premium ai-offer-premium ai-offer-best" data-checkout-action data-ai-buy-premium="1">
      <span class="ai-offer-badge">가성비 추천 · PREMIUM</span>
      <div class="ai-offer-copy">
        <small>매일 자주 상담하고 택일까지 볼 때</small>
        <b>프리미엄 30일</b>
        <span>AI 질문 총 30개 · 하루 최대 10개 · 신년 리포트와 정밀 택일</span>
      </div>
      <div class="ai-offer-price"><em>8,900원</em></div>
    </button>

    <!-- CHECKOUT_START -->
    <p class="checkout-pause-note" data-checkout-paused>질문권과 프리미엄 신규 구매를 잠시 중단했습니다.</p>
    <!-- CHECKOUT_END -->
    <div class="ai-paywall-note" data-checkout-action>자동결제 없이 1회 결제 · 질문권은 프리미엄 없이도 구매할 수 있어요.</div>
  `;

  wrap.querySelectorAll('[data-ai-buy-pack]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;
      btn.disabled = true;
      showToast('결제창을 준비하고 있어요…');
      try {
        await purchaseQuestionPack(btn.dataset.aiBuyPack);
      } catch (err) {
        console.error('질문권 결제 시작 실패', err);
        showToast('결제창을 열지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setTimeout(() => { btn.disabled = false; }, 1200);
      }
    });
  });

  const premiumBtn = wrap.querySelector('[data-ai-buy-premium]');
  if (premiumBtn) {
    premiumBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (premiumBtn.disabled) return;
      premiumBtn.disabled = true;
      showToast('프리미엄 결제창을 준비하고 있어요…');
      try {
        await payPremium();
      } catch (err) {
        console.error('프리미엄 결제 시작 실패', err);
        showToast('결제창을 열지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setTimeout(() => { premiumBtn.disabled = false; }, 1200);
      }
    });
  }

  win.appendChild(wrap);
  /* CHECKOUT_START */
  const revealOffer = () => {
    if (wrap.isConnected) win.scrollTop += wrap.getBoundingClientRect().top - win.getBoundingClientRect().top - 6;
  };
  requestAnimationFrame(() => requestAnimationFrame(revealOffer));
  /* CHECKOUT_END */
}
window.addEventListener('taekilso:questionPackPurchased', () => {
  document.querySelectorAll('.ai-chat-offer-grid').forEach(el => el.remove());
  document.querySelectorAll('.ai-chat-upsell').forEach(el => el.remove());

  setTimeout(() => {
    if (!getPendingPaidAiQuestion()) {
      restoreAlgorithmicFollowupsAfterPurchase();
    }
  }, 180);
});

function appendAiChatUpsell(userMessage='') {
  const win = document.getElementById('aiChatWindow');
  const div = document.createElement('div');
  div.className = 'ai-chat-upsell';
  let label = '🔓 내 사주 정밀분석으로 더 깊게 보기';
  if (/사업|창업|개업|장사|매출|파트너/.test(userMessage)) label = '🔓 사업·직업 흐름을 더 깊게 분석하기';
  else if (/연애|궁합|배우자|재회|썸/.test(userMessage)) label = '🔓 연애·궁합 흐름을 더 깊게 분석하기';
  else if (/돈|재물|수입|금전|투자|지출/.test(userMessage)) label = '🔓 재물 흐름을 더 깊게 분석하기';
  div.innerHTML = label;
  div.onclick = () => goTo('profile');
  win.appendChild(div);
  // 답변 바로 아래 붙는 보조 카드라 여기서도 스크롤을 다시 내리지 않습니다.
}

function escapeAiHtml(text){
  return String(text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function formatAiReply(text){
  let clean = String(text || '')
    .replace(/\\([#*_~`>\-])/g,'$1')
    .replace(/(^|\n)(\s*\d+)\\\.(\s+)/g,'$1$2.$3');
  let html = escapeAiHtml(clean).replace(/\r\n/g,'\n');
  html = html.replace(/^###\s*(.+)$/gm,'<div class="ai-chat-heading">$1</div>');
  html = html.replace(/^##\s*(.+)$/gm,'<div class="ai-chat-heading">$1</div>');
  html = html.replace(/^[ \t]*\*\*([^*\r\n]+)\*\*[ \t]*$/gm,'<div class="ai-chat-heading">$1</div>');
  html = html.replace(/\*\*(.+?)\*\*/g,'<span class="ai-chat-strong">$1</span>');
  html = html.replace(/^[-•]\s+(.+)$/gm,'<span class="ai-chat-bullet">$1</span>');
  html = html.replace(/^[ \t]*-{3,}[ \t]*$/gm,'<hr class="ai-chat-divider">');
  html = html.replace(/\n\n+/g,'<br><br>').replace(/\n/g,'<br>');
  html = html.replace(/(?:<br>)*<hr class="ai-chat-divider">(?:<br>)*/g,'<hr class="ai-chat-divider">');
  return html;
}

/* 메시지가 추가된 직후 바로 scrollHeight를 읽으면 폰트/레이아웃이 아직
   확정되지 않아 실제 높이보다 작게 계산되는 경우가 있어, 다음 프레임(2번)에
   다시 한번 맨 아래로 내려서 답변의 마지막 줄까지 확실히 보이게 합니다. */
function scrollAiChatToBottom(win) {
  if (!win) return;
  win.scrollTop = win.scrollHeight;
  requestAnimationFrame(() => {
    win.scrollTop = win.scrollHeight;
    requestAnimationFrame(() => { win.scrollTop = win.scrollHeight; });
  });
}

/* AI 답변이 길 때, 맨 아래(답변의 끝)가 아니라 "답변이 시작하는 지점"이
   채팅창 맨 위로 오도록 스크롤합니다. 사용자가 답변을 처음부터 읽을 수 있게 하기 위함. */
function scrollAiChatToMessageStart(win, div) {
  if (!win || !div) return;
  const target = () => Math.max(0, div.offsetTop - 6);
  win.scrollTop = target();
  requestAnimationFrame(() => {
    win.scrollTop = target();
    requestAnimationFrame(() => { win.scrollTop = target(); });
  });
}

function appendAiChatMessage(role, text, opts) {
  const win = document.getElementById('aiChatWindow');
  const div = document.createElement('div');
  div.className = 'ai-chat-msg ' + role;
  if (role === 'assistant') div.innerHTML = formatAiReply(text);
  else div.textContent = text;
  win.appendChild(div);
  if(role==='assistant'&&text){window.TaekilExperience?.decorate(div,text);if((window.__aiChatHistory||[]).some(m=>m.role==='assistant'&&m.content===text))window.TaekilExperience?.saveControl(div,text,opts?.evidence);}
  if (role === 'assistant' && opts?.evidence?.length) {
    window.dispatchEvent(new CustomEvent('taekilso:consultationEvidence',{detail:{element:div,evidence:opts.evidence}}));
  }
  const scrollMode = (opts && opts.scroll) || 'bottom'; // 'bottom' | 'start' | 'none'
  if (scrollMode === 'bottom') scrollAiChatToBottom(win);
  else if (scrollMode === 'start') scrollAiChatToMessageStart(win, div);
  return div;
}

function updateAiChatStatus(freeUsed, freeLimit, isPremiumNow, extra) {
  const el = document.getElementById('aiChatStatus');
  if (!el) return;

  if (extra && extra.isAdmin) {
    const used = Number.isInteger(extra.premiumDailyUsed) ? extra.premiumDailyUsed : null;
    const limit = Number.isFinite(Number(extra.premiumDailyLimit)) ? Number(extra.premiumDailyLimit) : 100;
    el.textContent = used == null ? `✦ 관리자 AI (하루 ${limit}개까지)` : `✦ 관리자 AI 오늘 ${used}/${limit}개 사용`;
  } else if (isPremiumNow) {
    const used = Number.isInteger(extra?.premiumDailyUsed) ? extra.premiumDailyUsed : null;
    const limit = extra?.premiumDailyLimit || 10;
    const totalLimit = extra?.premiumTotalLimit;
    if (Number.isInteger(totalLimit) && Number.isInteger(extra.premiumTotalUsed)) {
      const remaining = Math.max(0, totalLimit - extra.premiumTotalUsed);
      el.textContent = `✦ 이용권 질문 ${totalLimit}회 중 ${remaining}회 남음 · ${used == null ? `하루 최대 ${limit}개` : `오늘 ${used}/${limit}개 사용`}`;
    } else {
      el.textContent = used == null ? `✦ 프리미엄 이용 중 (하루 ${limit}개까지)` : `✦ 프리미엄 오늘 ${used}/${limit}개 사용`;
    }
  } else if (extra && extra.usingCredit) {
    el.textContent = `질문권 ${extra.questionCreditsLeft}개 남음`;
  } else if (freeUsed != null) {
    el.textContent = `무료 질문 ${freeUsed}/${freeLimit}개 사용`;
  }
}

async function refreshAiChatPremiumStatus() {
  const uid = accountStore.owner();
  const conversationId = window.__aiConversationId;
  const status = document.getElementById('aiChatStatus');
  if (!uid || !isPremium() || isAdmin() || !status) return;
  const initialText = status.textContent;
  const data = await recoverPremiumFromVerifiedServer(uid);
  if (data?.active && uid === accountStore.owner() && conversationId === window.__aiConversationId &&
      status.textContent === initialText) updateAiChatStatus(null, null, true, data);
}

const SAJU_VAULT_PREFIX = 'taekilso_saju_vault_';
function getSajuVaultKey(){ return accountStore.owner() ? SAJU_VAULT_PREFIX + accountStore.owner() : accountStore.key('taekilso_saju_vault'); }
function getSajuVault(){
  try { const v=JSON.parse((accountStore.owner() ? localStorage : sessionStorage).getItem(getSajuVaultKey())||'[]'); return Array.isArray(v)?v:[]; } catch(e){ return []; }
}
function setSajuVault(list){
  try { (accountStore.owner() ? localStorage : sessionStorage).setItem(getSajuVaultKey(), JSON.stringify((list||[]).slice(0,50))); } catch(e) { console.warn('사주 보관함 저장 실패', e); }
  renderSajuVault(); refreshAiProfileSelectors(); updateHistoryCounts();
}

function getSajuVaultCloudRef(uid) {
  if (!db || !uid) return null;
  return db.collection('users').doc(uid).collection('sajuProfiles');
}

function sanitizeSajuProfileForCloud(profile) {
  return {
    name: String(profile.name || '').slice(0, 20),
    relation: String(profile.relation || '').slice(0, 30),
    y: Number(profile.y || 0),
    m: Number(profile.m || 0),
    d: Number(profile.d || 0),
    calType: profile.calType === 'lunar' ? 'lunar' : 'solar',
    isLeap: !!profile.isLeap,
    hourValue: String(profile.hourValue || 'unknown').slice(0, 10),
    gender: String(profile.gender || 'unknown').slice(0, 10),
    birth: String(profile.birth || '').slice(0, 60),
    summary: String(profile.summary || '').slice(0, 2500),
    data: profile.data || {},
    updatedAt: Number(profile.updatedAt || Date.now())
  };
}

async function syncSajuVaultFromCloud(uid) {
  const accountToken = accountStore.snapshot();
  const authUser = firebaseReady && firebase.auth ? firebase.auth().currentUser : null;
  const ownerUid = uid || (authUser && !authUser.isAnonymous ? authUser.uid : null);
  if (!ownerUid || !db || ownerUid !== accountToken.owner) return;

  try {
    const snap = await getSajuVaultCloudRef(ownerUid).limit(50).get();
    if (!accountStore.current(accountToken)) return;
    const remote = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const local = getSajuVault();

    const merged = new Map();
    [...remote, ...local].forEach((p) => {
      if (!p || !p.id) return;
      const prev = merged.get(p.id);
      if (!prev || Number(p.updatedAt || 0) >= Number(prev.updatedAt || 0)) {
        merged.set(p.id, p);
      }
    });

    const list = Array.from(merged.values())
      .sort((a,b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
      .slice(0, 50);

    setSajuVault(list);

    // 기존에 이 브라우저에만 있던 사주도 로그인 계정으로 올립니다.
    const batch = db.batch();
    let writes = 0;
    for (const p of list) {
      if (!p.id) continue;
      batch.set(
        getSajuVaultCloudRef(ownerUid).doc(p.id),
        sanitizeSajuProfileForCloud(p),
        { merge:true }
      );
      writes++;
    }
    if (writes) await batch.commit();

  } catch (err) {
    console.warn('사주 보관함 클라우드 동기화 실패', err);
  }
}

async function saveSajuProfileToCloud(profile) {
  const authUser = firebaseReady && firebase.auth ? firebase.auth().currentUser : null;
  if (!db || !authUser || authUser.isAnonymous || !profile || !profile.id) return;

  try {
    await getSajuVaultCloudRef(authUser.uid)
      .doc(profile.id)
      .set(sanitizeSajuProfileForCloud(profile), { merge:true });
  } catch (err) {
    console.warn('사주 프로필 서버 저장 실패', err);
  }
}

async function deleteSajuProfileFromCloud(id) {
  const authUser = firebaseReady && firebase.auth ? firebase.auth().currentUser : null;
  if (!db || !authUser || authUser.isAnonymous || !id) return;

  try {
    await getSajuVaultCloudRef(authUser.uid).doc(id).delete();
  } catch (err) {
    console.warn('사주 프로필 서버 삭제 실패', err);
  }
}

function makeSajuProfileId(){ return 'sp_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function refreshAiProfileSelectors(){
  const list=getSajuVault();
  const saved=document.getElementById('aiChatSavedProfile');
  const compares=[
    document.getElementById('aiChatCompareProfile'),
    document.getElementById('aiChatCompareProfile2')
  ];
  const options=list.map(p=>`<option value="${p.id}">${escapeHtml(p.name||'이름 없음')} · ${escapeHtml(p.relation||'')}</option>`).join('');

  if(saved){
    const cur=saved.value;
    saved.innerHTML='<option value="">+ 새 사주 입력</option>'+options;
    if(list.some(p=>p.id===cur)) saved.value=cur;
  }

  compares.forEach((el,idx)=>{
    if(!el) return;
    const cur=el.value;
    el.innerHTML=`<option value="">${idx===0?'비교하지 않음':'두 번째 비교 대상 없음'}</option>`+options;
    if(list.some(p=>p.id===cur)) el.value=cur;
  });
}
function loadAiSavedProfile(id){
  const p = id ? getSajuVault().find(x => x.id === id) : {
    name:'나', relation:'본인', calType:'solar', y:'', m:'', d:'', hourValue:'unknown', gender:'unknown', isLeap:false
  };
  if (!p) return;
  const set=(id,v)=>{const el=document.getElementById(id); if(el&&v!=null) el.value=String(v)};
  set('aiChatProfileName',p.name); set('aiChatRelation',p.relation); set('aiChatCalType',p.calType); set('aiChatYear',p.y); set('aiChatMonth',p.m); set('aiChatDay',p.d); set('aiChatHour',p.hourValue); set('aiChatGender',p.gender);
  const leap=document.getElementById('aiChatLeap'); if(leap) leap.checked=!!p.isLeap;
}
function saveSajuProfileRecord(profile){
  const list=getSajuVault(); const picker=document.getElementById('aiChatSavedProfile'); const existingId=picker ? picker.value : '';
  const rec={...profile,id:existingId||profile.id||makeSajuProfileId(),updatedAt:Date.now()};
  const idx=list.findIndex(x=>x.id===rec.id); if(idx>=0) list[idx]=rec; else list.unshift(rec);
  setSajuVault(list);
  saveSajuProfileToCloud(rec);
  return rec;
}
function deleteSajuProfile(id){ if(!confirm('이 사주를 보관함에서 삭제할까요?')) return; setSajuVault(getSajuVault().filter(p=>p.id!==id)); deleteSajuProfileFromCloud(id); }
function useSajuProfileInChat(id){ goTo('home'); showAiChatSetupStep(); setTimeout(()=>{refreshAiProfileSelectors(); const el=document.getElementById('aiChatSavedProfile'); if(el){el.value=id;loadAiSavedProfile(id)}},50); }
function renderSajuVault(){
  const list=getSajuVault(), host=document.getElementById('sajuVaultList'), empty=document.getElementById('sajuVaultEmpty'); if(!host)return;
  host.innerHTML=list.map(p=>`<div class="saju-vault-item"><div><strong>${escapeHtml(p.name||'이름 없음')}</strong><small>${escapeHtml(p.relation||'')} · ${p.y}.${p.m}.${p.d} · ${p.hourValue==='unknown'?'시간 모름':String(p.hourValue).padStart(2,'0')+'시'}</small></div><div class="saju-vault-actions"><button onclick="useSajuProfileInChat('${p.id}')">상담</button><button onclick="deleteSajuProfile('${p.id}')">삭제</button></div></div>`).join('');
  if(empty) empty.style.display=list.length?'none':'block';
}
function openAiProfileCreator(){ goTo('home'); showAiChatSetupStep(); setTimeout(()=>{ const s=document.getElementById('aiChatSavedProfile'); if(s)s.value=''; const n=document.getElementById('aiChatProfileName'); if(n)n.value=''; },50); }

async function startAiChat(reportOptions) {
  if (!window.TaekilPrivacy?.confirmAge()) return;
  /* REPORT_MANUAL_OPTION_START */
  const reportManual = reportOptions && ['free-report','newyear-report'].includes(reportOptions.source);
  /* REPORT_MANUAL_OPTION_END */
  const y = +document.getElementById('aiChatYear').value;
  const m = +document.getElementById('aiChatMonth').value;
  const d = +document.getElementById('aiChatDay').value;
  if (!y || !m || !d) { showToast('생년월일을 모두 선택해주세요.'); return; }
  const calType = document.getElementById('aiChatCalType').value;
  const hourEl = document.getElementById('aiChatHour');
  const hourValue = hourEl ? hourEl.value : 'unknown';
  const genderEl = document.getElementById('aiChatGender');
  const gender = genderEl ? genderEl.value : 'unknown';
  const leapEl = document.getElementById('aiChatLeap');
  const isLeap = calType === 'lunar' && !!(leapEl && leapEl.checked);
  const birth = resolveBirthDate(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, calType, isLeap);
  if (!birth) return;
  const setup = document.getElementById('aiChatSetup');
  if (setup.hasAttribute('data-awaiting-ai-consent')) return;
  const accountToken = accountStore.snapshot();
  if (!await window.TaekilPrivacy?.confirmAI(setup)) return;
  if (!accountStore.current(accountToken) || !document.getElementById('view-home').classList.contains('visible')) return;

  const built = buildAiChatSajuSummary({y,m,d,calType,hourValue,gender,birth});
  const nameEl = document.getElementById('aiChatProfileName');
  const relationEl = document.getElementById('aiChatRelation');
  const name = (nameEl && nameEl.value.trim()) || '나';
  const relation = (relationEl && relationEl.value) || '본인';
  const saved = saveSajuProfileRecord({ name, relation, y,m,d,calType,isLeap,hourValue,gender,birth: birth.toISOString(), data: built.data, summary: built.text });
  window.__aiChatProfile = { ...saved };
  window.__aiChatSaju = built.text;
  const subjects = [{ name, relation, summary: built.text, profile: saved, data: built.data }];
  const compareIds = [
    (document.getElementById('aiChatCompareProfile') || {}).value,
    (document.getElementById('aiChatCompareProfile2') || {}).value
  ].filter(Boolean);

  const usedIds = new Set([saved.id]);
  compareIds.forEach(compareId => {
    if (usedIds.has(compareId) || subjects.length >= 3) return;
    const other = getSajuVault().find(p => p.id === compareId);
    if (other) {
      usedIds.add(compareId);
      subjects.push({
        name: other.name,
        relation: other.relation,
        summary: other.summary || '',
        profile: other,
        data: other.data || {}
      });
    }
  });

  window.__aiChatSubjects = subjects;
  window.__aiChatHistory = [];
  window.resetAiComposer?.();
  window.__aiConversationId = makeAiConversationId();
  window.__aiConsultantId = window.TaekilConsultationPersonas?.get(reportOptions?.consultantId).id || 'yeonwoo';
  setActiveAiSession(window.__aiConversationId);

  document.getElementById('aiChatSetup').style.display = 'none';
  document.getElementById('aiChatPanel').style.display = 'flex';
  document.getElementById('aiChatWindow').innerHTML = '';
  clearAiFollowupSuggestions();
  appendAiChatMessage('system-note', subjects.length > 1 ? `${subjects.length}명의 사주를 함께 불러왔어요. 관계·궁합·공동 일정처럼 여러 사람을 함께 비교해 질문할 수 있어요.` : `${name}님의 사주를 저장했어요. 이번 상담에서 계속 기억하고 볼게요.`);
  updateAiChatStatus(null, 3, isPremium());
  window.refreshAiChatPremiumStatus?.();
  /* CHECKOUT_START */
  void window.refreshQuestionCreditUI?.(accountStore.owner());
  /* CHECKOUT_END */

  // 결제 후 돌아온 경우 상담 화면이 준비되는 즉시, 사용자가 눌렀던 잠금 질문을 자동으로 이어갑니다.
  if (!reportManual && getPendingPaidAiQuestion()) setTimeout(() => resumePendingPaidAiQuestion(), 650);

  // 소개 화면/오늘의 운세에서 추천 질문을 먼저 눌렀던 경우,
  // 로그인·카카오 리다이렉트·사주 선택이 끝난 뒤 자동으로 그 질문을 이어서 보냅니다.
  const storedTodayQuestion = reportManual ? '' : takeTodayFortunePendingQuestion();
  const pendingQuestion = reportManual ? '' : (window.__pendingCategoryQuestion || storedTodayQuestion);
  if (pendingQuestion) {
    const q = pendingQuestion;
    window.__pendingCategoryQuestion = null;
    setTimeout(() => quickAskAiChat(q), 300);
  }
}

/* 빠른 질문 버튼 - 입력창에 채우고 바로 전송합니다. */
/* 홈 화면 챗봇 소개 화면의 "시작하기" 버튼입니다.
   로그인 안 된 상태면 여기서만 로그인을 요청하고, 로그인 완료되면 자동으로
   생년월일 입력 단계로 이어집니다(다시 시작하기를 누를 필요 없게). */
/* 소개 화면의 4개 고민 카테고리 버튼입니다. 로그인/생년월일 입력이 끝나면
   자동으로 그 질문을 이어서 보내도록, 원하는 질문을 잠깐 기억해둡니다. */
function handleHomeCategoryClick(btn, questionText) {
  window.__pendingCategoryQuestion = questionText;
  handleHomeChatStart(btn);
}

/* 로그인 안 한 사람에게만 "지금 가입하고 무료체험" 문구를 보여줍니다.
   로그인 확인이 아직 안 끝난 아주 이른 시점이면, 확인이 끝난 뒤 다시 판단합니다. */
async function updateHomeGuestHint() {
  const hint = document.getElementById('homeGuestHint');
  const startBtn = document.getElementById('homeStartChatBtn');

  if (getKakaoUser()) {
    if (hint) hint.style.display = 'none';
    if (startBtn) startBtn.textContent = '✨ 연우와 상담 시작하기';
    return;
  }

  if (!firebaseAuthReady) {
    await Promise.race([firebaseAuthSettled, new Promise((r) => setTimeout(r, 3000))]);
  }

  const loggedIn = getKakaoUser() || (firebaseReady && firebaseAuthReady && firebaseAuthUser);
  if (hint) hint.style.display = loggedIn ? 'none' : 'block';
  if (startBtn) startBtn.textContent = loggedIn
    ? '✨ 연우와 상담 시작하기'
    : '✨ 궁금한 것 무료로 물어보기';
}

async function handleHomeChatStart(btn) {
  // Collect the onboarding draft first. Authentication remains required at handoff.
  showAiChatSetupStep();
}

/* 소개 화면을 넘기고 생년월일 입력 단계를 보여줍니다. 이미 로그인된 상태로
   "시작하기"를 눌렀을 때도, 로그인하러 갔다가 돌아왔을 때도 공통으로 씁니다.
   여기서 다시 한번 날짜 선택 목록을 채워서, 페이지 로드 타이밍 문제로
   비어있는 채로 남는 경우가 없게 합니다(이미 채워져 있으면 그냥 넘어갑니다). */
function showAiChatSetupStep() {
  if (!window.TaekilPrivacy?.confirmAge()) return;
  fillAiChatDateSelects();
  refreshAiProfileSelectors();
  const intro = document.getElementById('homeIntroOverlay');
  const setup = document.getElementById('aiChatSetup');
  if (intro) intro.style.display = 'none';
  if (setup) setup.style.display = 'block';
}

/* 로그인 성공 직후(Google/Kakao 모두)마다 호출됩니다.
   "시작하기"를 누르고 로그인하러 간 상태였다면, 소개 화면을 넘기고
   생년월일 입력 단계를 바로 보여줍니다. 카카오는 전체 페이지가 새로
   불러와지므로, 그 경우에도 이어지도록 localStorage로 표시해둡니다. */
function continueHomeChatAfterLogin() {
  if (window.resumeGuidedConsultation?.()) return;
  if (localStorage.getItem('taekilso_pending_chat_start') !== '1') return;
  localStorage.removeItem('taekilso_pending_chat_start');

  // 카카오 로그인은 페이지가 새로 열리므로 오늘의 운세 추천 질문을 다시 복구합니다.
  if (!window.__pendingCategoryQuestion) {
    try {
      const raw = accountStore.getItem(TODAY_FORTUNE_PENDING_QUESTION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.question && Date.now() - Number(data.createdAt || 0) <= 30 * 60 * 1000) {
          window.__pendingCategoryQuestion = String(data.question || '').trim();
        }
      }
    } catch(e) {}
  }

  showAiChatSetupStep();
}

function clearAiFollowupSuggestions(){
  document.querySelectorAll('.ai-chat-followups').forEach(el => el.remove());
}
function normalizeAiFollowupText(text){
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g,'')
    .replace(/[?!.,~"'“”‘’()[\]{}:;·ㆍ\-_/\\]/g,'');
}

function aiFollowupIntent(text){
  const s = String(text || '');
  // 같은 의미의 표현까지 한 묶음으로 잡아, 이미 물어본 종류는 다시 추천하지 않습니다.
  if (/조심|주의|피해야|피하면|위험|단점|약점|실수|문제|경계/.test(s)) return 'caution';
  if (/좋은 점|강점|장점|잘하는|잘 맞는 점|유리/.test(s)) return 'strength';
  if (/어떻게|관리|활용|바꾸|방법|전략|하면 돼|모으려면|유지하려면/.test(s)) return 'action';
  if (/색|컬러|행운색/.test(s)) return 'color';
  if (/숫자|번호/.test(s)) return 'number';
  if (/방향|동쪽|서쪽|남쪽|북쪽/.test(s)) return 'direction';
  if (/환경|공간|분위기|생활 리듬|생활리듬/.test(s)) return 'environment';
  if (/활동|취미|운동|루틴/.test(s)) return 'activity';
  if (/직업|직장|사업|이직|진로|역할|업무|창업/.test(s)) return 'career';
  if (/연애|궁합|배우자|결혼|관계|상대|사랑/.test(s)) return 'love';
  if (/돈|재물|수입|금전|매출|재정/.test(s)) return 'money';
  if (/오행|행운/.test(s)) return 'traits';
  if (/핵심|기억할|우선순위|가장 중요/.test(s)) return 'core';
  if (/더 자세|더 깊|다른 특징|이어|또 뭐|놓친/.test(s)) return 'deeper';
  return 'other';
}

function getAiFollowupTopic(text){
  const s = String(text || '');
  if (/돈|재물|수입|금전|매출|재정/.test(s)) return 'money';
  if (/연애|궁합|배우자|결혼|썸|사랑|관계/.test(s)) return 'love';
  if (/직업|직장|취업|이직|진로|회사|창업|사업/.test(s)) return 'career';
  if (/색|숫자|방향|환경|오행|행운/.test(s)) return 'traits';
  return 'general';
}

function getUsedAiFollowupState(){
  const usedTexts = new Set();
  const usedIntents = new Set();

  (window.__aiChatHistory || [])
    .filter(m => m && m.role === 'user')
    .forEach(m => {
      const raw = String(m.content || '');
      usedTexts.add(normalizeAiFollowupText(raw));
      usedIntents.add(aiFollowupIntent(raw));
    });

  return { usedTexts, usedIntents };
}

function aiFollowupSet(question, reply, used){
  return window.TaekilExperienceCore.followups(question, reply, window.__aiChatHistory || [], window.__aiConsultantId);
}

function showAiOtherSajuTopics(locked){
  if (locked){
    openAiFollowupPurchase('다른 주제도 이어서 보기');
    return;
  }

  const win = document.getElementById('aiChatWindow');
  if (!win) return;

  clearAiFollowupSuggestions();

  const currentTopic = getAiFollowupTopic(
    [...(window.__aiChatHistory || [])].reverse().find(m => m && m.role === 'user')?.content || ''
  );

  const topicButtons = [
    { key:'money', label:'💰 재물운', q:'내 재물운을 봐줘' },
    { key:'love', label:'💕 연애·궁합', q:'내 연애운과 관계 성향을 봐줘' },
    { key:'career', label:'💼 직업·사업', q:'내 직업운과 일하는 성향을 봐줘' },
    { key:'traits', label:'✨ 성향·좋은 것', q:'내 사주의 성향과 나한테 잘 맞는 것을 봐줘' },
    { key:'general', label:'🔎 전체적인 특징', q:'내 사주의 다른 특징도 이어서 봐줘' }
  ].filter(x => x.key !== currentTopic);

  const wrap = document.createElement('div');
  wrap.className = 'ai-chat-followups';

  const note = document.createElement('div');
  note.className = 'ai-chat-followup-note';
  note.textContent = '다른 주제로도 이어서 볼까요?';
  wrap.appendChild(note);

  topicButtons.slice(0,4).forEach(item => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    b.onclick = () => {
      trackAiFunnel('topic_switch_click',{topic:item.key,question:item.q});
      clearAiFollowupSuggestions();
      prepareAiQuestion(item.q);
    };
    wrap.appendChild(b);
  });

  win.appendChild(wrap);
  scrollAiChatToBottom(win);
}

function showAiFollowups(question, reply, used, limit, locked){
  const win=document.getElementById('aiChatWindow'); if(!win) return;
  clearAiFollowupSuggestions();

  const wrap=document.createElement('div');
  wrap.className='ai-chat-followups';

  const list=aiFollowupSet(question,reply,used);
  if(!locked){const hint=document.createElement('p');hint.className='ai-chat-followup-note';hint.textContent='이어서 물어보기 · 선택 후 내용을 확인하고 전송해 주세요.';wrap.append(hint);}

  if(locked){
    const note=document.createElement('div');
    note.className='ai-chat-followup-note';
    note.textContent='🔒 다음으로 이런 것도 물어볼 수 있어요';
    wrap.appendChild(note);
  }

  list.forEach(label=>{
    const b=document.createElement('button');
    b.type='button';
    b.className=locked?'locked':'';
    b.textContent=(locked?'🔒 ':'')+label;
    b.onclick=()=>{
      if(locked){ openAiFollowupPurchase(label); return; }
      trackAiFunnel('followup_click',{question:label});
      clearAiFollowupSuggestions();
      prepareAiQuestion(label);
    };
    wrap.appendChild(b);
  });

  // 항상 마지막에는 다른 사주 주제로 갈 수 있는 메뉴를 둡니다.
  const other=document.createElement('button');
  other.type='button';
  other.className=locked?'locked':'';
  other.textContent=(locked?'🔒 ':'')+'다른 주제도 볼래';
  other.onclick=()=>showAiOtherSajuTopics(locked);
  wrap.appendChild(other);

  win.appendChild(wrap);
  scrollAiChatToBottom(win);
}


const AI_PENDING_PAID_QUESTION_KEY = 'taekilso_pending_paid_ai_question_v1';
const AI_FUNNEL_KEY = 'taekilso_ai_funnel_v1';

function savePendingPaidAiQuestion(question){
  const q=String(question||'').trim();
  if(!q) return;
  window.__pendingPaidAiQuestion=q;
  try{
    accountStore.setItem(AI_PENDING_PAID_QUESTION_KEY, JSON.stringify({
      question:q, uid:getCurrentUserKey()||'', createdAt:Date.now()
    }));
  }catch(e){}
}

function getPendingPaidAiQuestion(){
  try{
    const x=JSON.parse(accountStore.getItem(AI_PENDING_PAID_QUESTION_KEY)||'null');
    if(!x||!x.question) return '';
    if(Date.now()-Number(x.createdAt||0)>24*60*60*1000){
      accountStore.removeItem(AI_PENDING_PAID_QUESTION_KEY); return '';
    }
    const uid=getCurrentUserKey()||'';
    if(x.uid && uid && x.uid!==uid) return '';
    return String(x.question||'').trim();
  }catch(e){ return ''; }
}

function clearPendingPaidAiQuestion(){
  window.__pendingPaidAiQuestion='';
  try{accountStore.removeItem(AI_PENDING_PAID_QUESTION_KEY);}catch(e){}
}

const TAEKILSO_SEO_ATTR_KEY='taekilso_seo_attribution_v1';
const TAEKILSO_SEO_GUIDE_SLUGS=new Set(['2026-fortune','job-change-fortune','reunion-fortune','gapmok-day-master','eulmok-day-master','byeonghwa-day-master','jeonghwa-day-master','mujeong-day-master','gito-day-master','gyeonggeum-day-master','singeum-day-master','imsu-day-master','gyesu-day-master','employment-fortune','business-fortune','marriage-fortune','daewoon-guide','sewoon-guide','love-fortune','career-fortune','money-fortune','relationship-fortune','monthly-fortune','saju-compatibility-guide','marriage-date-guide','moving-date-guide','opening-date-guide','saju-guide','blog-index','blog-gunghap-worst-combo','blog-isa-sonobneun-nal-guide','blog-jaehoe-timing','blog-gyeolhon-taekil-checklist','blog-ai-saju-vs-jeontong','2027-fortune','2027-business-fortune','2027-career-fortune','2027-compatibility','2027-contract-date','2027-day-master-fortune','2027-employment-fortune','2027-love-fortune','2027-money-fortune','2027-monthly-fortune','2027-moving-date','2027-opening-date','2027-reunion-fortune','2027-samjae','2027-wedding-date','2027-zodiac-fortune','birth-time-unknown-saju','contract-date','free-saju','saju-question-guide','today-fortune','dream-guide-index','dream-snake','dream-money','dream-water','dream-teeth','dream-pregnancy','dream-deceased']);
function getSeoAttribution(){
  if (!window.TaekilMetricsPreference?.enabled()) return;
  try{const x=JSON.parse(localStorage.getItem(TAEKILSO_SEO_ATTR_KEY)||'null');if(!x||!x.slug||Date.now()-Number(x.at||0)>30*24*60*60*1000)return null;return x;}catch(e){return null;}
}
function captureSeoAttributionFromUrl(){
  if (!window.TaekilMetricsPreference?.enabled()) return;
  try{
    const p=new URLSearchParams(location.search), slug=String(p.get('seo_landing')||'').trim();
    if(!TAEKILSO_SEO_GUIDE_SLUGS.has(slug))return;
    const x={slug,at:Date.now()};
    localStorage.setItem(TAEKILSO_SEO_ATTR_KEY,JSON.stringify(x));
    sessionStorage.setItem('taekilso_seo_session_'+slug,'1');
    bumpDailySeoLanding('visits',slug,true);
  }catch(e){}
}
function seoSafeSlug(slug){return String(slug||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,50);}
function bumpDailySeoLanding(field,slug,once){
  /* SEO_ADMIN_GUARD_START */
  if(!firebaseAuthReady){firebaseAuthSettled.then(()=>bumpDailySeoLanding(field,slug,once));return;}
  if(!canRecordVisitorAnalytics())return;
  /* SEO_ADMIN_GUARD_END */
  if(!db)return;
  slug=seoSafeSlug(slug); if(!TAEKILSO_SEO_GUIDE_SLUGS.has(slug))return;
  const allowed=new Set(['visits','signups','firstAiAnswers','freeLimitExhausted','purchases']); if(!allowed.has(field))return;
  const key='seo_'+getKstDateKey()+'_'+slug+'_'+field;
  if(once){try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}catch(e){}}
  db.collection('dailySeoLanding').doc(getKstDateKey()+'__'+slug).set({date:getKstDateKey(),slug,[field]:firebase.firestore.FieldValue.increment(1)},{merge:true}).catch(()=>{});
}
function trackSeoConversion(field){
  const x=getSeoAttribution(); if(!x)return;
  const uid=getCurrentUserKey()||'guest';
  const k='seo_conv_'+field+'_'+x.slug+'_'+uid;
  try{if(localStorage.getItem(k))return;localStorage.setItem(k,'1');}catch(e){}
  bumpDailySeoLanding(field,x.slug,false);
}
setTimeout(captureSeoAttributionFromUrl,900);

const DAILY_FUNNEL_EVENT_MAP = {
  today_fortune_result_view: 'fortuneResults',
  today_fortune_to_ai_click: 'aiCtaClicks',
  free_limit_exhausted: 'freeLimitExhausted',
  premium_purchase_confirmed: 'purchases',
  question_pack_purchase_confirmed: 'purchases'
};

function bumpDailyFunnel(field){
  if (!db || !field) return;
  const dateKey = getKstDateKey();
  db.collection('dailyFunnel').doc(dateKey).set({
    date: dateKey,
    [field]: firebase.firestore.FieldValue.increment(1)
  }, { merge:true }).catch(err => console.warn('전환 퍼널 기록 실패', field, err));
}

function trackAiFunnel(eventName, extra){
  if (!window.TaekilMetricsPreference?.enabled()) return;
  const name=String(eventName||'').slice(0,60);
  if(!name) return;
  const item={event:name, at:Date.now()};
  // 운영 퍼널에는 질문 내용/사주/UID를 저장하지 않고 단계별 숫자만 +1 합니다.
  const funnelField = DAILY_FUNNEL_EVENT_MAP[name];
  if (funnelField) bumpDailyFunnel(funnelField);

  try{
    window.dispatchEvent(new CustomEvent('taekilso:aiFunnel',{detail:item}));
  }catch(e){}
}

function restoreAlgorithmicFollowupsAfterPurchase() {
  const panel = document.getElementById('aiChatPanel');
  const win = document.getElementById('aiChatWindow');

  if (!panel || panel.style.display === 'none' || !win) return false;

  const history = Array.isArray(window.__aiChatHistory)
    ? window.__aiChatHistory
    : [];

  let assistantIndex = -1;

  for (let i = history.length - 1; i >= 0; i--) {
    if (
      history[i] &&
      history[i].role === 'assistant' &&
      String(history[i].content || '').trim()
    ) {
      assistantIndex = i;
      break;
    }
  }

  if (assistantIndex < 0) return false;

  let lastQuestion = '';

  for (let i = assistantIndex - 1; i >= 0; i--) {
    if (
      history[i] &&
      history[i].role === 'user' &&
      String(history[i].content || '').trim()
    ) {
      lastQuestion = String(history[i].content || '').trim();
      break;
    }
  }

  const lastReply = String(history[assistantIndex].content || '').trim();

  if (!lastQuestion || !lastReply) return false;

  clearAiFollowupSuggestions();
  showAiFollowups(lastQuestion, lastReply, 1, 3, false);
  trackAiFunnel('paid_followups_restored', { question:lastQuestion });

  setTimeout(() => scrollAiChatToBottom(win), 80);
  return true;
}

function resumePendingPaidAiQuestion(){
  const q=getPendingPaidAiQuestion();
  if(!q) return false;
  const panel=document.getElementById('aiChatPanel');
  const input=document.getElementById('aiChatInput');
  if(!panel || panel.style.display==='none' || !input) return false;
  clearPendingPaidAiQuestion();
  trackAiFunnel('paid_question_auto_resume',{question:q});
  input.value=q;
  setTimeout(()=>sendAiChatMessage(),250);
  return true;
}

function openAiFollowupPurchase(question){
  savePendingPaidAiQuestion(question);
  trackAiFunnel('locked_followup_click',{question:String(question||'')});
  appendAiChatMessage('system-note','무료 질문 3개를 모두 사용했어요. 이 질문이 궁금하다면 질문권 또는 프리미엄으로 상담을 이어갈 수 있어요.');
  if (typeof appendQuestionPackOffers === 'function') appendQuestionPackOffers();
  if (typeof appendAiChatUpsell === 'function') appendAiChatUpsell(question);
}

function scrollHomePastAiIntro(){
  const first = document.querySelector('#view-home .home-first-block');
  if (!first) {
    window.scrollBy({ top: Math.max(420, window.innerHeight * 0.8), behavior:'smooth' });
    return;
  }

  let target = first.nextElementSibling;
  while (target && target.offsetParent === null) target = target.nextElementSibling;

  if (target && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior:'smooth', block:'start' });
  } else {
    window.scrollTo({
      top: first.offsetTop + first.offsetHeight,
      behavior:'smooth'
    });
  }
}

function quickAskAiChat(text) {
  if (document.getElementById('aiChatSendBtn')?.disabled) return;
  const input = document.getElementById('aiChatInput');
  if (input) input.value = text;
  sendAiChatMessage();
}

/* 모바일 가상 키보드 대응
   - visualViewport 높이가 줄어들면 AI 패널 자체를 "보이는 화면" 높이에 맞춥니다.
   - 따라서 입력창은 키보드 뒤에 가려지지 않고 항상 키보드 바로 위에 남습니다.
   - 키보드가 닫히면 기존 카드 안의 absolute 레이아웃으로 정확히 복귀합니다. */
(function setupAiMobileKeyboardViewport(){
  const vv = window.visualViewport;
  let keyboardTimer = null;
  let focusBaselineHeight = 0;

  function getParts(){
    return {
      input: document.getElementById('aiChatInput'),
      row: document.querySelector('#aiChatPanel .ai-chat-inputrow'),
      panel: document.getElementById('aiChatPanel'),
      win: document.getElementById('aiChatWindow')
    };
  }

  function currentLayoutHeight(){
    return Math.max(
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0
    );
  }

  function clearKeyboardMode(){
    const { panel, win } = getParts();
    document.body.classList.remove('ai-keyboard-open');

    if (panel) {
      panel.style.removeProperty('top');
      panel.style.removeProperty('height');
      panel.style.removeProperty('max-height');
    }

    if (win) {
      win.style.removeProperty('scroll-behavior');
    }
  }

  function ensureComposerVisible(){
    const { input, row, win } = getParts();
    if (!input || !row) return;

    requestAnimationFrame(() => {
      const r = row.getBoundingClientRect();
      const visibleTop = vv ? Number(vv.offsetTop || 0) : 0;
      const visibleBottom = vv
        ? visibleTop + Number(vv.height || window.innerHeight)
        : window.innerHeight;

      if (r.bottom > visibleBottom - 8 || r.top < visibleTop + 8) {
        try {
          row.scrollIntoView({
            block:'end',
            inline:'nearest',
            behavior:'auto'
          });
        } catch(e) {}
      }

      if (win) {
        win.style.scrollBehavior = 'auto';
        win.scrollTop = win.scrollHeight;
      }
    });
  }

  function syncKeyboardViewport(forceFocus){
    const { input, panel } = getParts();
    if (!input || !panel) return;

    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const focused = forceFocus || document.activeElement === input;

    if (!mobile || !focused) {
      clearKeyboardMode();
      return;
    }

    if (!focusBaselineHeight) {
      focusBaselineHeight = currentLayoutHeight();
    }

    if (vv) {
      const viewportHeight = Math.round(vv.height);
      const baseline = Math.max(focusBaselineHeight, currentLayoutHeight());
      const keyboardOpen = viewportHeight < baseline - 110;

      if (keyboardOpen) {
        document.body.classList.add('ai-keyboard-open');
        panel.style.top = Math.round(vv.offsetTop || 0) + 'px';
        panel.style.height = viewportHeight + 'px';
        panel.style.maxHeight = viewportHeight + 'px';

        ensureComposerVisible();
        setTimeout(ensureComposerVisible, 70);
        setTimeout(ensureComposerVisible, 180);
        setTimeout(ensureComposerVisible, 320);
        return;
      }
    }

    ensureComposerVisible();
  }

  function queueSync(){
    clearTimeout(keyboardTimer);
    keyboardTimer = setTimeout(() => syncKeyboardViewport(false), 24);
  }

  document.addEventListener('focusin', (e) => {
    if (e.target && e.target.id === 'aiChatInput') {
      focusBaselineHeight = currentLayoutHeight();
      setTimeout(() => syncKeyboardViewport(true), 30);
      setTimeout(() => syncKeyboardViewport(true), 120);
      setTimeout(() => syncKeyboardViewport(true), 260);
      setTimeout(ensureComposerVisible, 430);
    }
  });

  document.addEventListener('focusout', (e) => {
    if (e.target && e.target.id === 'aiChatInput') {
      setTimeout(() => {
        if (document.activeElement?.id !== 'aiChatInput') {
          focusBaselineHeight = 0;
          clearKeyboardMode();
        }
      }, 140);
    }
  });

  document.addEventListener('input', (e) => {
    if (
      e.target &&
      e.target.id === 'aiChatInput' &&
      document.body.classList.contains('ai-keyboard-open')
    ) {
      ensureComposerVisible();
    }
  });

  if (vv) {
    vv.addEventListener('resize', queueSync);
    vv.addEventListener('scroll', queueSync);
  }

  window.addEventListener('resize', queueSync);

  window.addEventListener('orientationchange', () => {
    focusBaselineHeight = 0;
    clearKeyboardMode();
    setTimeout(queueSync, 320);
  });
})()

/* "직접 질문하기" - 입력창에 포커스만 주고 전송하지 않습니다. */
function focusAiChatInput() {
  const input = document.getElementById('aiChatInput');
  if (input) input.focus();
}

async function sendAiChatMessage() {
  const accountToken = accountStore.snapshot();
  const conversationId = window.__aiConversationId;
  const sameConversation = () => accountStore.current(accountToken) && window.__aiConversationId === conversationId;
  const loggedIn = getKakaoUser() || (firebaseReady && firebaseAuthReady && firebaseAuthUser);
  if (!loggedIn) { showToast('로그인 후 이용할 수 있어요.'); openAuthModal(); return; }

  const input = document.getElementById('aiChatInput');
  const message = input.value.trim();
  if (!message) return;
  if (message.length > 500) { showToast('질문은 500자 이내로 적어주세요.'); return; }

  const uid = getCurrentUserKey();
  const sendBtn = document.getElementById('aiChatSendBtn');
  if (!conversationId || sendBtn.disabled) return;
  if (!window.TaekilPrivacy?.hasAIConsent()) {
    const panel = document.getElementById('aiChatPanel');
    sendBtn.disabled = true;
    let consent;
    try {
      consent = await window.TaekilPrivacy?.confirmAI(panel);
    } finally {
      if (sameConversation()) sendBtn.disabled = false;
    }
    if (!consent || !sameConversation() || panel.style.display !== 'flex' || input.value.trim() !== message) return;
  }
  input.value = '';
  sendBtn.disabled = true;
  input.dispatchEvent(new Event('input', {bubbles:true}));
  window.TaekilExperience?.clearFailure();
  clearAiFollowupSuggestions();

  // 대화가 시작되면 하단에 항상 떠 있던 추천 질문 6개 버튼을 숨겨서
  // 실제 채팅창(.ai-chat-window)이 쓸 수 있는 세로 공간을 되돌려줍니다.
  // (이 버튼들이 계속 자리를 차지해 채팅창이 눌리면서 답변 아랫부분이
  //  화면 밖으로 밀려 "잘려 보이는" 원인이었습니다.)
  const quickActionsEl = document.getElementById('aiChatQuickActions');
  if (quickActionsEl && quickActionsEl.style.display !== 'none') {
    quickActionsEl.style.display = 'none';
  }

  const userQuestionEl = appendAiChatMessage('user', message);
  const restoreQuestion = () => {
    if (!input.value.trim()) {
      input.value = message;
      userQuestionEl.remove();
      input.dispatchEvent(new Event('input', {bubbles:true}));
    }
  };
  setActiveAiSession(window.__aiConversationId);

  const typingEl = appendAiChatMessage('assistant', '');
  typingEl.classList.add('ai-chat-typing');
  typingEl.innerHTML = '<p class="consultation-progress-text" role="status">연우가 질문을 살펴보고 있어요.</p><div aria-hidden="true"><span></span><span></span><span></span></div>';
  const consultant = window.TaekilConsultationPersonas?.get(window.__aiConsultantId);
  if (consultant && consultant.id !== 'yeonwoo') {
    typingEl.querySelector('.consultation-progress-text').textContent = consultant.name + ' · 질문을 살펴보고 있어요.';
  }
  const stage = document.querySelector('.ai-chat-stage');
  if (stage) stage.classList.add('ai-chat-thinking'); // 캐릭터 주변이 은은하게 반응합니다.

  let receivedAnswer = false;
  try {
    const res = await fetch(AI_CHAT_URL, {
      method: 'POST',
      headers: await (async () => { const headers = await getAiRequestHeaders(); if (!sameConversation()) throw new Error('ACCOUNT_CHANGED'); return headers; })(),
      body: JSON.stringify({
        uid,
        consultantId: consultant?.id || 'yeonwoo',
        sajuSummary: window.__aiChatSaju,
        sajuProfile: window.__aiChatProfile,
        /* NEWYEAR_SCOPE_START */
        consultationScope: window.__newyearChatContext ? 'newyear' : undefined,
        /* NEWYEAR_SCOPE_END */
        subjects: window.__aiChatSubjects || [],
        /* QUALITY_PAYLOAD_START */
        reportSnapshot: window.__freeReportSnapshot || undefined,
        analytics: window.TaekilCampaign?.analytics?.(),
        /* QUALITY_PAYLOAD_END */
        history: window.__aiChatHistory.slice(-12).map(({role,content})=>({role,content})),
        message
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!sameConversation()) return;
    /* REPORT_QUESTION_EVENT_START */
    const hasAnswer = res.ok && typeof data.reply === 'string' && data.reply.trim();
    if (hasAnswer && !data.restricted && data.stopReason !== 'server_capability') window.dispatchEvent(new CustomEvent('taekilso:aiQuestionAccepted'));
    /* REPORT_QUESTION_EVENT_END */
    typingEl.remove();

    if (res.status === 401) {
      restoreQuestion();
      showToast('로그인 보안 세션이 만료됐어요. 다시 로그인한 뒤 질문해주세요.');
      return;
    }

    if (!hasAnswer) {
      restoreQuestion();
      if (data.error === 'AI_TRANSFER_CONSENT_REQUIRED') {
        window.TaekilPrivacy?.forgetAIConsent();
        showToast('국외 이전 동의가 필요해요. 내 프로필의 개인정보 설정에서 확인해 주세요.');
        return;
      }
      /* NEWYEAR_RESPONSE_START */
      if (data.error === 'NEWYEAR_PASS_REQUIRED' || data.error === 'NEWYEAR_PROFILE_REQUIRED') {
        appendAiChatMessage('system-note', data.message);
        if (data.error === 'NEWYEAR_PASS_REQUIRED') window.appendNewyearPassOffer?.();
        return;
      }
      /* NEWYEAR_RESPONSE_END */
      if (data.error === 'FREE_LIMIT_REACHED') {
        appendAiChatMessage('system-note', data.message || '무료 질문을 모두 사용하셨어요.');
        appendQuestionPackOffers();
      } else if (data.error === 'DAILY_LIMIT_REACHED' || data.error === 'PREMIUM_TOTAL_LIMIT_REACHED') {
        appendAiChatMessage('system-note', data.message || '오늘 상담 가능 횟수를 모두 사용하셨어요.');
        updateAiChatStatus(null, null, true, data);
      } else {
        (window.TaekilExperience?.failure || ((text) => appendAiChatMessage('system-note',text)))(typeof data.message === 'string' ? data.message.slice(0, 300) : '답변을 받아오지 못했어요. 잠시 후 다시 시도해주세요.', message);
      }
      return;
    }

    receivedAnswer = true;
    /* QUALITY_RESPONSE_START */
    const evidence = window.TaekilExperienceCore?.normalizeEvidence(data.evidence) || [];
    /* QUALITY_RESPONSE_END */
    const answerEl = appendAiChatMessage('assistant', data.reply, { scroll: 'start', evidence });

    if (data.restricted || data.stopReason === 'server_capability') {
      // 수명·질병·도박·구체 투자지시 등 제한 질문은 결제 유도나 서비스 CTA를 붙이지 않고,
      // 민감한 질문을 계정 상담 기록에도 자동 저장하지 않습니다. 사용량도 서버에서 차감하지 않습니다.
      if (data.restricted) showToast('이 질문은 사주로 단정하지 않는 범위에서 안내했어요.');
      const restrictedWin = document.getElementById('aiChatWindow');
      scrollAiChatToMessageStart(restrictedWin, userQuestionEl || answerEl);
      setTimeout(() => scrollAiChatToMessageStart(restrictedWin, userQuestionEl || answerEl), 120);
      return;
    }

    window.__aiChatHistory.push({ role: 'user', content: message }, { role: 'assistant', content: data.reply, ...(evidence.length ? {evidence} : {}) });
    saveCurrentAiConversation();
    window.TaekilExperience?.saveControl(answerEl,data.reply,evidence);

    // 첫 AI 답변을 실제 activation으로 집계합니다.
    // 질문/답변 내용은 저장하지 않고, 해당 계정의 첫 성공 답변일 때만 숫자 +1.
    try {
      const firstAiKey = 'taekilso_first_ai_answer_' + String(uid || 'guest');
      if (!localStorage.getItem(firstAiKey)) {
        localStorage.setItem(firstAiKey, String(Date.now()));
        bumpDailyFunnel('firstAiAnswers');
        trackSeoConversion('firstAiAnswers');
      }
    } catch(e) {}

    // 사용자가 채팅에 2개 이상의 실제 후보 날짜를 적었다면, AI 문장 답변 아래에
    // 같은 택일 계산식을 사용한 비교 카드를 바로 붙입니다. 일반적인 날짜 질문은 기존 택일 CTA를 유지합니다.
    const renderedInlineDateCompare = appendAiInlineSpecificDateComparison(message);
    if (!renderedInlineDateCompare) appendAiChatServiceCta(message);

    // 사용권 판정은 반드시 '질문권 사용 여부'를 무료 사용량보다 먼저 봅니다.
    // 질문권 사용자의 응답에도 freeUsed=3이 함께 오기 때문에,
    // freeUsed만 먼저 검사하면 질문권이 남아 있어도 무료 소진자로 잘못 판단해
    // 결제 안내/잠금 꼬리질문을 다시 보여주는 문제가 생깁니다.
    if (data.usingCredit) {
      updateAiChatStatus(null, null, false, data);
      // 질문권이 1개 차감된 뒤 서버가 보내준 실제 잔여 개수로 즉시 표시합니다.
      showAiFollowups(message, data.reply, 1, 3, false);
    } else if (data.isAdmin || data.freeUsed == null) {
      // 관리자/프리미엄은 기존처럼 잠금 없이 계속 상담합니다.
      updateAiChatStatus(null, null, true, data);
      showAiFollowups(message, data.reply, 1, 3, false);
    } else {
      // 실제 무료 질문을 사용한 경우에만 무료 3회 제한 로직을 적용합니다.
      updateAiChatStatus(data.freeUsed, data.freeLimit, false, data);
      const freeDone = Number(data.freeUsed) >= Number(data.freeLimit || 3);
      trackAiFunnel(`free_question_${Number(data.freeUsed)}`, { question: message });
      if (freeDone) { trackAiFunnel('free_limit_exhausted', { question: message }); trackSeoConversion('freeLimitExhausted'); }
      showAiFollowups(message, data.reply, data.freeUsed, data.freeLimit || 3, freeDone);
      if (freeDone) appendAiChatUpsell(message);
    }

    // CTA/꼬리질문을 답변 아래에 붙이는 과정에서 스크롤이 다시 맨 아래로 내려가므로,
    // 모든 요소가 렌더링된 뒤 최종적으로 "고객이 방금 보낸 질문"부터 보이게 맞춥니다.
    // 질문 아래로 바로 AI 답변이 이어지기 때문에 사용자는 질문 → 답변 순서로 자연스럽게 읽을 수 있습니다.
    // 폰트/레이아웃 지연까지 고려해 여러 프레임과 짧은 지연 후 한 번 더 보정합니다.
    const answerWin = document.getElementById('aiChatWindow');
    const restoreQuestionStart = () => scrollAiChatToMessageStart(answerWin, userQuestionEl || answerEl);
    restoreQuestionStart();
    requestAnimationFrame(() => {
      restoreQuestionStart();
      requestAnimationFrame(restoreQuestionStart);
    });
    setTimeout(restoreQuestionStart, 120);
    setTimeout(restoreQuestionStart, 320);
  } catch (err) {
    if (!sameConversation()) return;
    typingEl.remove();
    if (!receivedAnswer) {
      restoreQuestion();
      (window.TaekilExperience?.failure || ((text) => appendAiChatMessage('system-note',text)))('연결이 끊겨 답변을 확인하지 못했어요. 사용 내역을 확인한 뒤 다시 시도해 주세요.', message);
    }
    console.error('AI 상담 오류', err);
  } finally {
    if (sameConversation()) sendBtn.disabled = false;
    if (sameConversation() && stage) stage.classList.remove('ai-chat-thinking');
  }
}

function fillFortuneDateSelects(){
  const y=document.getElementById('fortuneYear'),m=document.getElementById('fortuneMonth'),d=document.getElementById('fortuneDay');
  if(!y||!m||!d||y.options.length) return;
  const now=new Date();
  for(let yy=1940;yy<=new Date().getFullYear();yy++){
    const o=document.createElement('option');o.value=yy;o.textContent=yy+'년';y.appendChild(o);
  }
  for(let mm=1;mm<=12;mm++){
    const o=document.createElement('option');o.value=mm;o.textContent=mm+'월';m.appendChild(o);
  }
  for(let dd=1;dd<=31;dd++){
    const o=document.createElement('option');o.value=dd;o.textContent=dd+'일';d.appendChild(o);
  }
  y.value=1990;m.value=1;d.value=1;
}
function openFortuneModal(){
  fillFortuneDateSelects();
  document.getElementById('fortuneResult').innerHTML='';
  document.getElementById('fortuneModal').classList.add('show');
  applyLockedBirthTo('fortune');
}
function closeFortuneModal(){document.getElementById('fortuneModal').classList.remove('show')}


const TODAY_FORTUNE_PENDING_QUESTION_KEY = 'taekilso_pending_today_fortune_question_v1';

function saveTodayFortunePendingQuestion(question){
  const q = String(question || '').trim();
  if (!q) return;
  window.__pendingCategoryQuestion = q;
  try {
    accountStore.setItem(TODAY_FORTUNE_PENDING_QUESTION_KEY, JSON.stringify({
      question: q,
      createdAt: Date.now()
    }));
  } catch(e) {}
}

function takeTodayFortunePendingQuestion(){
  try {
    const raw = accountStore.getItem(TODAY_FORTUNE_PENDING_QUESTION_KEY);
    if (!raw) return '';
    const data = JSON.parse(raw);
    accountStore.removeItem(TODAY_FORTUNE_PENDING_QUESTION_KEY);
    if (!data || !data.question) return '';
    if (Date.now() - Number(data.createdAt || 0) > 30 * 60 * 1000) return '';
    return String(data.question || '').trim();
  } catch(e) {
    try { accountStore.removeItem(TODAY_FORTUNE_PENDING_QUESTION_KEY); } catch(_) {}
    return '';
  }
}

const TODAY_FORTUNE_HIGH_SCORE = 73;
function buildTodayFortuneQuestions(score, todayOh, userOh){
  const s = Number(score || 0);
  const high = s >= TODAY_FORTUNE_HIGH_SCORE;
  const low = s < 65;
  const relation = todayOh === userOh
    ? '오늘은 내 기운과 같은 오행이 겹치는 날'
    : (GENERATES[userOh] === todayOh || GENERATES[todayOh] === userOh)
      ? '오늘은 내 사주와 상생 흐름이 있는 날'
      : (OVERCOMES[userOh] === todayOh || OVERCOMES[todayOh] === userOh)
        ? '오늘은 내 사주와 상극 흐름이 있어 속도 조절이 필요한 날'
        : '오늘은 균형을 확인하면서 움직이면 좋은 날';

  if (high) {
    return [
      { icon:'💰', label:'오늘 재물운 활용법', q:`${relation}이라고 나왔어요. 오늘 제 재물운에서 가장 잘 활용하면 좋은 점과 돈과 관련해 현실적으로 할 수 있는 행동을 알려주세요.` },
      { icon:'💕', label:'오늘 연애·관계운', q:`${relation}이라고 나왔어요. 오늘 연애나 인간관계에서 제가 먼저 움직여도 좋은지, 어떤 태도가 유리한지 알려주세요.` },
      { icon:'💼', label:'오늘 일·사업운', q:`${relation}이라고 나왔어요. 오늘 직장이나 사업에서 밀어붙여도 좋은 일과 한 번 더 확인해야 할 일을 나눠서 알려주세요.` }
    ];
  }

  if (low) {
    return [
      { icon:'💰', label:'오늘 돈에서 조심할 점', q:`${relation}이라고 나왔어요. 오늘 돈이나 소비, 계약과 관련해 특히 조심해야 할 점과 무리하지 않는 방법을 알려주세요.` },
      { icon:'💕', label:'오늘 관계에서 피할 행동', q:`${relation}이라고 나왔어요. 오늘 연애나 인간관계에서 오해를 만들기 쉬운 행동과 더 좋은 대응 방법을 알려주세요.` },
      { icon:'💼', label:'오늘 일에서 주의할 점', q:`${relation}이라고 나왔어요. 오늘 직장이나 사업에서 서두르지 말아야 할 부분과 우선순위를 알려주세요.` }
    ];
  }

  return [
    { icon:'💰', label:'오늘 재물운 핵심', q:`${relation}이라고 나왔어요. 오늘 제 재물운에서 가장 중요한 포인트와 돈과 관련해 우선하면 좋은 행동을 알려주세요.` },
    { icon:'💕', label:'오늘 연애·관계운', q:`${relation}이라고 나왔어요. 오늘 연애나 인간관계에서 어떤 태도를 취하면 좋은지 구체적으로 알려주세요.` },
    { icon:'💼', label:'오늘 일·사업운', q:`${relation}이라고 나왔어요. 오늘 직장이나 사업에서 가장 중요한 포인트와 현실적으로 챙길 일을 알려주세요.` }
  ];
}

function startAiFromTodayFortune(question){
  const q = String(question || '').trim();
  if (q) saveTodayFortunePendingQuestion(q);
  try {
    trackAiFunnel('today_fortune_to_ai_click', {
      source:'today_fortune_result',
      preset: q ? 'recommended_question' : 'direct_question'
    });
  } catch(e) {}
  closeFortuneModal();
  try { goTo('home'); } catch(e) {}
  setTimeout(() => handleHomeChatStart(), 80);
}


function calculateTodayFortune(){
  const y=+document.getElementById('fortuneYear').value;
  const m=+document.getElementById('fortuneMonth').value;
  const d=+document.getElementById('fortuneDay').value;
  if (!y || !m || !d) { showToast('생년월일을 모두 선택해주세요.'); return; }
  const calType = getCalType('fortuneCalType');
  const isLeap = document.getElementById('fortuneLeap') ? document.getElementById('fortuneLeap').checked : false;
  const birth = resolveBirthDate(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, calType, isLeap);
  if (!birth) return;
  const userIdx=dayGanjiIndex(birth), userOh=ohaengOf(userIdx);
  const today=new Date();
  const todayIdx=dayGanjiIndex(today), todayOh=ohaengOf(todayIdx);
  let score=55, advice='오늘은 무리하게 결론을 내리기보다 한 번 더 확인하고 움직이는 편이 좋습니다.';
  const reasons=[];
  if(todayOh===userOh){score+=12;reasons.push('내 기운과 같은 오행')}
  else if(GENERATES[userOh]===todayOh || GENERATES[todayOh]===userOh){score+=18;reasons.push('상생 흐름')}
  else if(OVERCOMES[userOh]===todayOh || OVERCOMES[todayOh]===userOh){score-=12;reasons.push('상극 관계 · 속도 조절')}
  if(today.getDay()===0||today.getDay()===6) score+=3;
  score=Math.max(35,Math.min(95,score));
  if(score>=TODAY_FORTUNE_HIGH_SCORE) advice='오늘은 새로운 일을 시작하거나 중요한 대화를 정리하기에 비교적 좋은 흐름입니다. 다만 결정은 현실 조건을 함께 확인하세요.';
  else if(score>=65) advice='전체적으로 무난한 편입니다. 해야 할 일을 하나씩 정리하고 중요한 약속은 시간을 넉넉하게 잡아보세요.';
  else advice='오늘은 속도보다 점검이 중요한 날입니다. 큰 결정은 서두르지 말고 한 번 더 확인하는 것을 권합니다.';
  document.getElementById('fortuneResult').innerHTML=`
    <div class="fortune-result">
      <div class="fr-head">
        <div><div class="fortune-kicker">TODAY · ${today.getMonth()+1}월 ${today.getDate()}일</div>
        <div class="fr-title">${ganjiFull(todayIdx)} · ${todayOh} 기운</div></div>
        <div class="fr-score">${score}<small style="font-size:10px;color:var(--muted)"> / 100</small></div>
      </div>
      <div class="service-badge">내 일주 ${ganjiFull(userIdx)} · ${userOh} · ${reasons.length?reasons.join(' · '):'균형 확인'}</div>
      <p>${advice}</p>
    </div>
    ${(() => {
      const qs = buildTodayFortuneQuestions(score, todayOh, userOh);
      return `
      <div style="margin-top:12px;padding:13px 14px;border:1px solid rgba(215,181,109,.20);border-radius:15px;background:rgba(215,181,109,.055);">
        <b style="display:block;color:#f3dfad;font-size:13px;margin-bottom:5px;">오늘 운세에서 더 궁금한 걸 바로 물어보세요</b>
        <span style="display:block;color:var(--muted);font-size:11px;line-height:1.55;margin-bottom:10px;">지금 결과에 맞춰 연우가 이어서 보기 좋은 질문을 골랐어요.</span>
        <div class="today-fortune-ai-questions">
          ${qs.map(item => `<button type="button" onclick='startAiFromTodayFortune(${JSON.stringify(item.q)})'><span>${item.icon}</span><b>${item.label}</b><i>→</i></button>`).join('')}
        </div>
        <button class="today-fortune-direct-ai" type="button" onclick="startAiFromTodayFortune()">직접 질문하기</button>
        <small style="display:block;text-align:center;color:var(--muted-2);font-size:9.5px;margin-top:8px;">가입하면 궁금한 것 3가지를 무료로 물어볼 수 있어요 · 카드등록 없음</small>
      </div>`;
    })()}
    <p style="color:var(--muted-2);font-size:10.5px;line-height:1.7;margin:12px 2px 0">※ 자동 계산된 참고용 운세입니다. 의료·법률·재정 등 전문적인 판단을 대신하지 않습니다.</p>`;
  try { trackAiFunnel('today_fortune_result_view', { score, todayOh, userOh }); } catch(e) {}
}
