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
  window.resetAiComposer = () => {
    suggestedQuestion = '';
    if (input) input.value = '';
    if (send) send.disabled = false;
    const starters = document.getElementById('aiChatQuickActions');
    if (starters) starters.style.display = '';
    document.querySelector('.ai-chat-stage')?.classList.remove('ai-chat-thinking');
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
  if (log) new MutationObserver(updateProfileLine).observe(log, {childList:true});
  window.addEventListener('resize',resize,{passive:true});
  viewport?.addEventListener('resize',resize,{passive:true});
  viewport?.addEventListener('scroll',resize,{passive:true});
  sync();
})();
