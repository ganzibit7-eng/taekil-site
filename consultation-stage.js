// Presentation only: keep profile entry and conversation inside one video stage.
(() => {
  const home=document.getElementById('view-home');
  const setup=document.getElementById('aiChatSetup');
  const panel=document.getElementById('aiChatPanel');
  const intro=document.getElementById('homeIntroOverlay');
  const exit=document.getElementById('consultationExit');
  if(!home||!setup||!panel||!intro||!exit)return;
  const profileLine = document.getElementById('aiChatCurrentProfile');
  const log = document.getElementById('aiChatWindow');
  const compare = setup.querySelector('.consultation-compare');
  const compareLabel = compare?.querySelector('summary span');
  const savedProfile = document.getElementById('aiChatSavedProfile');
  const compareFields = ['aiChatCompareProfile', 'aiChatCompareProfile2'].map(id => document.getElementById(id));
  const input = document.getElementById('aiChatInput');
  const send = document.getElementById('aiChatSendBtn');
  let suggestedQuestion = '';

  function resizeComposer() {
    if (!input?.offsetWidth) return;
    input.style.height = 'auto';
    const desired = input.scrollHeight;
    input.style.height = Math.min(112, Math.max(44, desired)) + 'px';
    input.style.overflowY = desired > 112 ? 'auto' : 'hidden';
  }
  input?.addEventListener('input', resizeComposer);

  window.resetAiComposer = () => {
    suggestedQuestion = '';
    if (input) input.value = '';
    if (send) send.disabled = false;
    const starters = document.getElementById('aiChatQuickActions');
    if (starters) starters.style.display = '';
    document.querySelector('.ai-chat-stage')?.classList.remove('ai-chat-thinking');
    resizeComposer();
  };

  window.prepareAiQuestion = text => {
    if (!input || send?.disabled) return;
    if (input.value.trim() && input.value !== suggestedQuestion) {
      input.focus();
      showToast('작성 중인 질문이 있어요. 입력창에서 이어서 적어주세요.');
      return;
    }
    suggestedQuestion = text;
    input.value = text;
    input.dispatchEvent(new Event('input', {bubbles:true}));
    input.focus();
    input.setSelectionRange(text.length, text.length);
  };
  document.querySelectorAll('[data-open-basic-report]').forEach(button => {
    button.addEventListener('click', () => openSajuInsight('profile'));
  });

  function updateProfileLine() {
    if (!profileLine) return;
    const profile = panel.style.display === 'flex' ? window.__aiChatProfile : null;
    const visible = Boolean(profile?.y && profile?.m && profile?.d);
    profileLine.hidden = !visible;
    if (!visible) {
      profileLine.textContent = '';
      return;
    }
    const calendar = profile.calType === 'lunar' ? (profile.isLeap ? '음력 윤달' : '음력') : '양력';
    const hour = profile.hourValue == null || profile.hourValue === 'unknown' || profile.hourValue === ''
      ? '시간 모름' : String(profile.hourValue).padStart(2, '0') + '시대';
    const count = (window.__aiChatSubjects || []).length - 1;
    const parts = [profile.name || '나', `${calendar} ${profile.y}.${String(profile.m).padStart(2, '0')}.${String(profile.d).padStart(2, '0')}`, hour];
    if (count > 0) parts.push(`비교 ${count}명`);
    const line = parts.join(' · ');
    if (profileLine.textContent !== line) profileLine.textContent = line;
  }

  function updateCompareLabel() {
    if (!compareLabel) return;
    const count = new Set(compareFields.map(field => field?.value).filter(id => id && id !== savedProfile?.value)).size;
    compareLabel.textContent = count ? `${count}명 선택` : '선택';
  }
  compareFields.forEach(field => field?.addEventListener('change', updateCompareLabel));
  savedProfile?.addEventListener('change', updateCompareLabel);
  let opened=false,returnY=0,frame=0;
  const viewport=window.visualViewport;
  function size(){
    frame=0;if(!opened)return;
    const height=viewport?.height||window.innerHeight;
    const offset=viewport?.offsetTop||0;
    const nav=document.querySelector('.topbar');
    const navHeight=nav?Math.min(nav.getBoundingClientRect().height,88):0;
    document.documentElement.style.setProperty('--consult-height',height+'px');
    document.documentElement.style.setProperty('--consult-offset',offset+'px');
    document.documentElement.style.setProperty('--consult-nav',navHeight+'px');
  }
  function resize(){if(!frame)frame=requestAnimationFrame(size);}
  function sync(){
    updateProfileLine();
    updateCompareLabel();
    resizeComposer();
    const next=home.classList.contains('visible')&&(setup.style.display==='block'||panel.style.display==='flex');
    if(next===opened){if(next)resize();return;}
    opened=next;
    document.documentElement.classList.toggle('consultation-open',opened);
    document.body.classList.toggle('consultation-open',opened);
    if(opened){size();window.scrollTo({top:0,left:0,behavior:'instant'});}
    else{
      const input=document.getElementById('aiChatInput');if(document.activeElement===input)input.blur();
      ['--consult-height','--consult-offset','--consult-nav'].forEach(key=>document.documentElement.style.removeProperty(key));
      if(home.classList.contains('visible'))window.scrollTo({top:returnY,left:0,behavior:'instant'});
    }
  }
  function close(){
    setup.style.display='none';panel.style.display='none';intro.style.display='block';
    sync();document.getElementById('homeStartChatBtn')?.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('#homeStartChatBtn,.brand-story-start');
    if(trigger&&!opened)returnY=window.scrollY;
    if(opened&&event.target.closest('.topbar .brand'))close();
  },true);
  exit.addEventListener('click',close);
  new MutationObserver(sync).observe(home,{attributes:true,attributeFilter:['class']});
  const observer=new MutationObserver(sync);
  [setup,panel].forEach(element=>observer.observe(element,{attributes:true,attributeFilter:['style']}));
  if (log) new MutationObserver(() => {
    updateProfileLine();
    resizeComposer();
  }).observe(log, {childList:true});
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('resize',resizeComposer,{passive:true});
  viewport?.addEventListener('resize',resize,{passive:true});
  viewport?.addEventListener('scroll',resize,{passive:true});
  sync();
})();

// Progressive presentation of the existing fields; calculation and saving remain in startAiChat.
(() => {
  const setup = document.getElementById('aiChatSetup');
  const scroll = setup?.querySelector('.consultation-profile-scroll');
  const heading = scroll?.querySelector('.consultation-setup-heading');
  const submit = setup?.querySelector(':scope > button');
  if (!scroll || !heading || !submit) return;
  const field = id => document.getElementById('aiChat' + id);
  const saved = field('SavedProfile');
  const steps = [
    ['성별을 알려주시겠어요?', '반가워요. 당신의 이야기를 들려주세요.'],
    ['언제 태어나셨나요?', '당신의 사주가 시작된 날을 알려주세요.'],
    ['태어난 시간도 아시나요?', '모르셔도 괜찮아요. 아는 정보부터 살펴볼게요.'],
    ['어떻게 불러드릴까요?', '대화하는 동안 불러드릴 이름이에요.'],
    ['마음에 남은 고민이 있나요?', '선택 사항이에요. 천천히 들려주셔도 좋아요.'],
    ['이제, 이야기를 시작해요.', '입력하신 정보는 로그인 후에도 이어집니다.']
  ];
  const panes = steps.map((_, i) => {
    const pane = document.createElement('section');
    pane.className = 'consultation-entry-step';
    pane.dataset.step = String(i);
    scroll.append(pane);
    return pane;
  });
  const move = (node, index) => { if (node) panes[index].append(node); };
  move(scroll.querySelector('.ai-chat-profile-picker'), 0);
  move(scroll.querySelector('.ai-chat-profile-fields'), 3);
  move(field('Gender').parentElement, 0);
  const genderChoices = document.createElement('div');
  genderChoices.className = 'consultation-gender-choices';
  genderChoices.setAttribute('role','group'); genderChoices.setAttribute('aria-label','성별 선택');
  for (const option of field('Gender').options) {
    const choice = document.createElement('button'); choice.type = 'button';
    choice.textContent = option.textContent; choice.dataset.value = option.value;
    choice.addEventListener('click', () => {
      field('Gender').value = option.value;
      field('Gender').dispatchEvent(new Event('change',{bubbles:true}));
      syncChoices();
      render(1, true);
    });
    genderChoices.append(choice);
  }
  field('Gender').parentElement.append(genderChoices);
  field('Gender').hidden = true;
  field('Gender').previousElementSibling.hidden = true;
  function syncChoices() {
    for (const choice of genderChoices.children) choice.setAttribute('aria-pressed',String(choice.dataset.value === field('Gender').value));
    scroll.querySelector('.ai-chat-profile-picker').hidden = !member() || saved.options.length < 2;
    const compare = scroll.querySelector('.consultation-compare');
    if (compare) compare.hidden = !member() || saved.options.length < 2;
  }
  new MutationObserver(syncChoices).observe(saved,{childList:true});
  move(scroll.querySelector('.ai-chat-setup-row'), 1);
  move(scroll.querySelector('.consultation-lunar-option'), 1);
  const birthInput = document.createElement('input');
  birthInput.id = 'consultationEntryBirth'; birthInput.type = 'text'; birthInput.inputMode = 'numeric';
  birthInput.autocomplete = 'bday'; birthInput.placeholder = 'YYYY.MM.DD'; birthInput.maxLength = 10;
  birthInput.setAttribute('aria-label','생년월일 8자리'); birthInput.setAttribute('aria-describedby','consultationBirthHint');
  const birthHint = document.createElement('p'); birthHint.id = 'consultationBirthHint'; birthHint.className = 'entry-field-hint';
  birthHint.textContent = '예: 19900101 · 연도, 월, 일 순서로 입력해 주세요.';
  const birthLine = document.createElement('div'); birthLine.className = 'entry-birth-line';
  const calendar = document.createElement('div'); calendar.className = 'entry-calendar-choices';
  calendar.setAttribute('role','group'); calendar.setAttribute('aria-label','달력 종류');
  for (const [value, label] of [['solar','양력'],['lunar','음력']]) {
    const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = label; btn.dataset.value = value;
    btn.addEventListener('click', () => { field('CalType').value = value; field('CalType').dispatchEvent(new Event('change',{bubbles:true})); syncCalendar(); });
    calendar.append(btn);
  }
  birthLine.append(birthInput,calendar);
  panes[1].prepend(birthLine,birthHint);
  panes[1].querySelector('.ai-chat-setup-row').hidden = true;
  function syncCalendar() {
    for (const btn of calendar.children) btn.setAttribute('aria-pressed',String(btn.dataset.value === field('CalType').value));
  }
  function birthFromFields() {
    birthInput.value = field('Year').value && field('Month').value && field('Day').value
      ? `${field('Year').value}.${field('Month').value.padStart(2,'0')}.${field('Day').value.padStart(2,'0')}` : '';
  }
  birthInput.addEventListener('input', () => {
    const parsed = core.birth(birthInput.value);
    const caret = birthInput.selectionStart;
    const atEnd = caret === birthInput.value.length;
    birthInput.value = parsed.text;
    if (!atEnd) birthInput.setSelectionRange(caret,caret);
    field('Year').value = parsed.y; field('Month').value = parsed.m; field('Day').value = parsed.d;
    error.textContent = ''; birthInput.removeAttribute('aria-invalid');
    next.disabled = !parsed.complete;
  });
  birthInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); if (validateDate()) render(2,true); }
  });
  move(field('Hour').parentElement, 2);
  move(scroll.querySelector('.ai-chat-profile-note'), 2);
  const unknownTime = document.createElement('button'); unknownTime.type = 'button'; unknownTime.className = 'entry-time-unknown'; unknownTime.textContent = '시간 모름';
  unknownTime.addEventListener('click', () => { field('Hour').value = 'unknown'; field('Hour').dispatchEvent(new Event('change',{bubbles:true})); render(3,true); });
  field('Hour').parentElement.classList.add('entry-time-line');
  field('Hour').parentElement.append(unknownTime);
  field('Hour').previousElementSibling.textContent = '출생시간 · 시 단위';
  scroll.querySelector('.ai-chat-birth-extra')?.remove();
  const review = document.createElement('dl');
  review.className = 'consultation-entry-review';
  panes[5].append(review);
  move(scroll.querySelector('.consultation-compare'), 5);
  const question = document.createElement('textarea');
  question.id = 'consultationEntryQuestion'; question.maxLength = 200;
  question.rows = 4; question.setAttribute('aria-label', '지금의 고민 (선택)');
  question.placeholder = '예: 이직을 고민하고 있어요. 지금 직장과 새로운 기회 사이에서 어떤 점을 살펴보면 좋을까요?';
  const count = document.createElement('p'); count.className = 'consultation-entry-count';
  const draftNote = document.createElement('p'); draftNote.className = 'consultation-entry-draft-note';
  draftNote.textContent = '입력 내용은 이 탭에 최대 30분간 임시 보관돼요. 로그인 후 그대로 이어갈 수 있어요.';
  const signupNote = document.createElement('p'); signupNote.className = 'entry-signup-note';
  signupNote.textContent = 'Google·카카오로 간편가입 · 첫 질문 3개 무료';
  panes[4].append(question, count);
  panes[5].append(signupNote,draftNote);
  const progress = document.createElement('p');
  progress.className = 'consultation-entry-progress';
  heading.prepend(progress);
  heading.querySelector('h2').tabIndex = -1;
  const error = document.createElement('p');
  error.className = 'consultation-entry-error';
  error.setAttribute('role', 'alert');
  scroll.append(error);
  const actions = document.createElement('div');
  actions.className = 'consultation-entry-actions';
  const button = (label, className, action) => {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = label; el.className = className;
    el.addEventListener('click', action);
    actions.append(el); return el;
  };
  let step = 0;
  const back = button('이전', 'entry-back', () => render(step - 1, true));
  const next = button('다음', 'entry-next', () => {
    if (step === 1 && !validateDate()) return;
    render(step + 1, true);
  });
  actions.append(submit);
  setup.append(actions);
  setup.classList.add('consultation-guided-entry');
  const stage = setup.closest('.ai-chat-stage');
  const entryNav = document.createElement('div'); entryNav.className = 'consultation-entry-nav';
  const entryBack = document.createElement('button'); entryBack.type = 'button'; entryBack.setAttribute('aria-label','이전 단계 또는 홈으로');
  entryBack.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  entryBack.addEventListener('click', () => { if(step) render(step-1,true); else document.getElementById('consultationExit').click(); });
  const entryTitle = document.createElement('span'); entryTitle.textContent = '연우와의 첫 대화';
  const entryCount = document.createElement('span'); entryCount.className = 'entry-nav-count';
  entryNav.append(entryBack,entryTitle,entryCount); stage.append(entryNav);

  function validateDate() {
    const y = +field('Year').value, m = +field('Month').value, d = +field('Day').value;
    if (!y || !m || !d) {
      const years = [...field('Year').options].map(option => Number(option.value)).filter(Boolean);
      error.textContent = `생년월일 8자리를 확인해 주세요. ${Math.min(...years)}~${Math.max(...years)}년을 입력할 수 있어요.`;
      birthInput.setAttribute('aria-invalid','true');
      birthInput.focus({preventScroll:true});
      return false;
    }
    const date = resolveBirthDate(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, field('CalType').value, field('CalType').value === 'lunar' && field('Leap').checked);
    error.textContent = date ? '' : '달력에 없는 날짜예요. 생일과 달력 종류를 확인해 주세요.';
    birthInput.setAttribute('aria-invalid',String(!date));
    return !!date;
  }
  function updateReview() {
    const selected = id => field(id).selectedOptions[0]?.textContent || '선택 안 함';
    const entries = [
      ['상담할 분', (field('ProfileName').value.trim() || '나') + ' · ' + selected('Relation')],
      ['성별', selected('Gender')],
      ['생일', `${field('Year').value}.${field('Month').value}.${field('Day').value} · ${selected('CalType')}${field('CalType').value === 'lunar' && field('Leap').checked ? ' 윤달' : ''}`],
      ['출생시간', selected('Hour')]
    ];
    review.replaceChildren();
    entries.forEach(([label, value]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; review.append(dt, dd);
    });
  }
  function render(index, focus = false) {
    step = Math.max(0, Math.min(steps.length - 1, index));
    panes.forEach((pane, i) => { pane.hidden = i !== step; });
    progress.textContent = `${step + 1} / ${steps.length} · 연우와 만나는 준비`;
    syncChoices();
    syncCalendar();
    signupNote.hidden = !!member();
    entryCount.textContent = `${step + 1} / ${steps.length}`;
    setup.dataset.entryStep = String(step);
    heading.querySelector('h2').textContent = steps[step][0];
    heading.querySelector('p:not(.consultation-entry-progress)').textContent = steps[step][1];
    back.hidden = step === 0;
    next.hidden = step === 5;
    next.disabled = step === 1 && !core.birth(birthInput.value).complete;
    submit.hidden = step !== 5;
    submit.textContent = member() ? '연우와 상담 시작하기' : '로그인하고 상담 이어가기';
    error.textContent = '';
    count.textContent = `${question.value.length} / 200`;
    if (step === 5) updateReview();
    scroll.scrollTop = 0;
    if (focus) {
      document.activeElement?.blur();
      heading.querySelector('h2').focus({preventScroll:true});
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches && scroll.animate) {
        scroll.getAnimations().forEach(animation => animation.cancel());
        scroll.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
      }
    }
    if (focus) persist();
  }
  saved.addEventListener('change', () => {
    birthFromFields();
    if (saved.value && validateDate()) render(5, true);
    else render(0);
  });
  // Keep external report/profile handoffs intact; reset only on a new visible entry.
  let visible = false;
  new MutationObserver(() => {
    const nextVisible = setup.style.display === 'block';
    if (nextVisible && !visible && !restore()) render(0);
    visible = nextVisible;
  }).observe(setup, {attributes:true, attributeFilter:['style']});
  const core = window.TaekilConsultationDraft;
  const key = 'taekilso_consultation_entry_v1';
  let awaitingAuth = false;
  let lastOwner = owner();
  function member() {
    return typeof firebaseAuthUser !== 'undefined' && firebaseAuthUser && !firebaseAuthUser.isAnonymous ? firebaseAuthUser : null;
  }
  function owner() { return member()?.uid || ''; }
  function persist() {
    const values = {};
    core.fields.forEach(id => { values[id] = field(id).value; });
    try {
      const selections = Object.fromEntries(['SavedProfile','CompareProfile','CompareProfile2'].map(id => [id, owner() ? field(id).value : '']));
      sessionStorage.setItem(key, JSON.stringify({version:1,at:Date.now(),owner:owner(),awaitingAuth,step,values,selections,leap:field('Leap').checked,question:question.value,birthText:birthInput.value}));
      return true;
    } catch (_) { return false; }
  }
  function read() {
    try {
      const draft = core.read(sessionStorage.getItem(key), Date.now(), owner());
      if (!draft && (typeof firebaseAuthReady === 'undefined' || firebaseAuthReady)) sessionStorage.removeItem(key);
      return draft;
    } catch (_) { return null; }
  }
  function restore() {
    const draft = read();
    if (!draft) return false;
    fillAiChatDateSelects();
    ['SavedProfile','CompareProfile','CompareProfile2'].forEach(id => { field(id).value = draft.selections[id]; });
    core.fields.forEach(id => { field(id).value = draft.values[id]; });
    field('Leap').checked = draft.leap; question.value = draft.question;
    birthFromFields(); if (draft.birthText) birthInput.value = draft.birthText;
    awaitingAuth = draft.awaitingAuth;
    render(draft.step);
    return true;
  }
  setup.addEventListener('input', () => { count.textContent = `${question.value.length} / 200`; persist(); });
  setup.addEventListener('change', () => persist());
  submit.addEventListener('click', async event => {
    // Capture the existing inline action so no guest can save/start before sign-in.
    event.preventDefault(); event.stopImmediatePropagation();
    if (!validateDate()) { render(1, true); validateDate(); return; }
    if (!member()) {
      awaitingAuth = true;
      if (!persist()) { error.textContent = '입력을 보관하지 못했어요. 브라우저의 저장 공간 설정을 확인해 주세요.'; return; }
      localStorage.setItem('taekilso_pending_chat_start', '1');
      openAuthModal();
      return;
    }
    const actor = member();
    submit.disabled = true;
    try {
      if (typeof checkMemberAccess === 'function' && !await checkMemberAccess(actor, {strict:true})) return;
      if (member()?.uid !== actor.uid) return;
      // Manual handoff prepares a draft question; never charge or call Claude on navigation.
      startAiChat({source:'free-report'});
      if (document.getElementById('aiChatPanel').style.display !== 'flex') return;
      const input = document.getElementById('aiChatInput');
      input.value = question.value.trim(); input.dispatchEvent(new Event('input', {bubbles:true}));
      window.__pendingCategoryQuestion = '';
      sessionStorage.removeItem(key); awaitingAuth = false;
    } catch (_) {
      error.textContent = '상담 연결을 확인하지 못했어요. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.';
    } finally { submit.disabled = false; }
  }, true);
  window.resumeGuidedConsultation = () => {
    const draft = read();
    if (!draft?.awaitingAuth || !member()) return false;
    goTo('home'); showAiChatSetupStep(); restore();
    awaitingAuth = false; render(5); persist();
    closeAuthModal();
    localStorage.removeItem('taekilso_pending_chat_start');
    return true;
  };
  window.addEventListener('taekilso:authChanged', () => {
    const changed = lastOwner !== owner(); lastOwner = owner();
    if (!window.resumeGuidedConsultation()) {
      read();
      if (changed) { question.value = ''; birthInput.value = ''; awaitingAuth = false; }
      submit.textContent = member() ? '연우와 상담 시작하기' : '로그인하고 상담 이어가기';
    }
    syncChoices();
  });
  render(0);
  Promise.resolve(typeof firebaseAuthSettled !== 'undefined' ? firebaseAuthSettled : null)
    .then(() => window.resumeGuidedConsultation());
})();
