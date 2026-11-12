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
    ['성별을 알려주시겠어요?', '선택하지 않고도 상담을 이어갈 수 있어요.'],
    ['태어난 날을 알려주세요.', '양력과 음력을 한 번 더 확인해 주세요.'],
    ['태어난 시간도 알고 계신가요?', '정확히 모르셔도 괜찮아요. 아는 정보부터 살펴볼게요.'],
    ['어떻게 불러드릴까요?', '나의 이야기든, 소중한 사람의 이야기든 좋아요.'],
    ['지금 어떤 고민이 있으신가요?', '선택 사항이에요. 상담창에서 천천히 적으셔도 좋아요.'],
    ['이제, 연우와 이야기 나눠요.', '입력한 내용을 확인하고 상담으로 이어가세요.']
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
  move(field('Hour').parentElement, 2);
  move(scroll.querySelector('.ai-chat-profile-note'), 2);
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
  panes[4].append(question, count);
  panes[5].append(draftNote);
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

  function validateDate() {
    const y = +field('Year').value, m = +field('Month').value, d = +field('Day').value;
    if (!y || !m || !d) {
      error.textContent = '태어난 연도, 월, 일을 모두 선택해 주세요.';
      ['Year', 'Month', 'Day'].map(field).find(el => !+el.value)?.focus({preventScroll:true});
      return false;
    }
    const date = resolveBirthDate(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, field('CalType').value, field('CalType').value === 'lunar' && field('Leap').checked);
    error.textContent = date ? '' : '달력에 없는 날짜예요. 생일과 달력 종류를 확인해 주세요.';
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
    heading.querySelector('h2').textContent = steps[step][0];
    heading.querySelector('p:not(.consultation-entry-progress)').textContent = steps[step][1];
    back.hidden = step === 0;
    next.hidden = step === 5;
    submit.hidden = step !== 5;
    submit.textContent = member() ? '사주 저장하고 상담 시작하기' : '로그인 · 회원가입하고 이어가기';
    error.textContent = '';
    count.textContent = `${question.value.length} / 200`;
    if (step === 5) updateReview();
    scroll.scrollTop = 0;
    if (focus) heading.querySelector('h2').focus({preventScroll:true});
    if (focus) persist();
  }
  saved.addEventListener('change', () => {
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
      sessionStorage.setItem(key, JSON.stringify({version:1,at:Date.now(),owner:owner(),awaitingAuth,step,values,selections,leap:field('Leap').checked,question:question.value}));
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
      if (changed) { question.value = ''; awaitingAuth = false; }
      submit.textContent = member() ? '사주 저장하고 상담 시작하기' : '로그인 · 회원가입하고 이어가기';
    }
    syncChoices();
  });
  render(0);
  Promise.resolve(typeof firebaseAuthSettled !== 'undefined' ? firebaseAuthSettled : null)
    .then(() => window.resumeGuidedConsultation());
})();
