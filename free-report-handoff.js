/* Reuses the existing free calculator, sign-in and chat. Never sends an AI question. */
(() => {
  'use strict';
  const C=window.TaekilReportHandoff;if(!C)return;
  const KEY='taekilso_free_report_handoff_v1',EVENT_KEY='taekilso_report_events_v1';
  const modal=document.getElementById('sajuInsightModal'),result=document.getElementById('sajuInsightResult'),auth=document.getElementById('authOverlay');
  if(!modal||!result||!auth)return;
  Object.assign(DAILY_FUNNEL_EVENT_MAP,C.events);
  let current=null,box=null,primary=null,note=null,payload=null,busy=false,choosing=false,authOpen=false,lastUid='',resuming=false,restoringFlowId=null;
  const seen=new Set();
  const user=()=>typeof firebaseAuthUser!=='undefined'&&firebaseAuthUser&&!firebaseAuthUser.isAnonymous?firebaseAuthUser:null;
  const uid=()=>user()?.uid||null;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  function read(){
    try{const raw=sessionStorage.getItem(KEY);if(raw)payload=JSON.parse(raw);}catch(_){}
    const checked=C.pending(payload,Date.now(),uid());
    if(!checked){payload=null;try{sessionStorage.removeItem(KEY);}catch(_){}}
    return payload=checked;
  }
  function persist(){try{if(payload)sessionStorage.setItem(KEY,JSON.stringify(payload));else sessionStorage.removeItem(KEY);}catch(_){}}
  function event(name,id){
    if(!C.events[name]||!id)return;
    const key=id+':'+name;let sent=[];
    try{sent=JSON.parse(sessionStorage.getItem(EVENT_KEY)||'[]');if(!Array.isArray(sent))sent=[];}catch(_){}
    if(seen.has(key)||sent.includes(key))return;
    seen.add(key);
    sent.push(key);try{sessionStorage.setItem(EVENT_KEY,JSON.stringify(sent.slice(-150)));}catch(_){}
    // No dates of birth, questions, profile names or identifiers leave this adapter.
    trackAiFunnel(name,{source:'free_report'});
  }
  async function member(){
    const actor=user();if(!actor||typeof db==='undefined'||!db)return null;
    const snap=await db.collection('users').doc(actor.uid).get({source:'server'});
    return snap.exists?snap.data():null;
  }
  async function update(){
    if(!box)return;
    if(!user()){
      primary.textContent='연우에게 무료로 질문하기';note.textContent='회원가입 후 AI 상담 총 3회 무료 · 카드 등록 불필요';return;
    }
    primary.textContent='이용 상태 확인 중…';
    try{const state=C.availability(await member());if(!box)return;primary.textContent=state.label;note.textContent=state.note;}
    catch(_){primary.textContent='상담 이용 상태 확인하기';note.textContent='이용 상태를 확인하지 못했어요. 버튼을 눌러 다시 확인해 주세요.';}
  }
  async function handoff(){
    const p=read(),actor=user();if(!p||!actor||busy||p.stage==='cancelled'||p.stage==='handed')return;
    busy=true;
    try{
      if(typeof checkMemberAccess==='function'&&!await checkMemberAccess(actor,{strict:true}))return;
      const data=await member(),latest=read();if(uid()!==actor.uid||latest?.id!==p.id||latest?.stage==='cancelled')return;
      if(!data){if(note)note.textContent='계정 정보를 확인하고 있어요. 잠시 후 다시 눌러 주세요.';return;}
      const state=C.availability(data);
      if(state.kind==='exhausted'){
        payload={...p,owner:actor.uid,stage:'awaiting-access'};persist();offerResume();
        closeSajuInsight();closeAuthModal();document.body.classList.remove('report-auth-open');goTo('plans');showToast('무료 질문을 모두 사용했어요. 기존 질문권이나 상담 이용권으로 이어갈 수 있어요.');return;
      }
      // Consume before navigation: repeated sign-in callbacks cannot open or send twice.
      await saveCurrentAiConversation();
      const finalPending=read();if(uid()!==actor.uid||finalPending?.id!==p.id||finalPending?.stage==='cancelled')return;
      payload={...p,owner:actor.uid,stage:'handed',handedAt:Date.now()};persist();
      document.querySelector('.report-resume-question')?.remove();
      closeSajuInsight();closeAuthModal();document.body.classList.remove('report-auth-open');
      window.__newyearChatContext=false;
      window.dispatchEvent(new CustomEvent('taekilso:freeReportHandoff'));
      goTo('home');showAiChatSetupStep();
      const set=(id,value)=>{const n=document.getElementById(id);if(n)n.value=String(value);};
      set('aiChatSavedProfile','');set('aiChatProfileName','나');set('aiChatRelation','본인');set('aiChatCalType',p.profile.calType);
      set('aiChatYear',p.profile.y);set('aiChatMonth',p.profile.m);set('aiChatDay',p.profile.d);set('aiChatHour','unknown');set('aiChatGender','unknown');
      const leap=document.getElementById('aiChatLeap');if(leap)leap.checked=p.profile.isLeap;
      ['aiChatCompareProfile','aiChatCompareProfile2'].forEach(id=>set(id,''));
      startAiChat({source:'free-report'});
      payload={...payload,conversationId:window.__aiConversationId};persist();
      const input=document.getElementById('aiChatInput');input.value=p.question;input.dispatchEvent(new Event('input',{bubbles:true}));
      updateAiChatStatus(Number(data.aiFreeUsed||0),3,state.kind==='premium',state.kind==='credits'?{usingCredit:true,questionCreditsLeft:Number(data.aiQuestionCredits||0)}:undefined);
      appendAiChatMessage('system-note',p.question?'무료 리포트의 사주와 선택한 질문을 가져왔어요. 내용을 확인하고 전송 버튼을 눌러 주세요.':'무료 리포트의 사주를 가져왔어요. 궁금한 내용을 적고 전송해 주세요.');
    }catch(_){
      payload={...p,stage:'cancelled'};persist();
      showToast('상담 연결을 마치지 못했어요. 리포트에서 다시 시도해 주세요.');
    }finally{busy=false;}
  }
  function offerResume(){
    if(document.querySelector('.report-resume-question'))return;
    const b=el('button','이용권 확인 후 선택한 질문 이어가기','btn report-resume-question');b.type='button';b.addEventListener('click',handoff);
    document.querySelector('#view-plans .hero-actions')?.append(b);
  }
  async function choose(question='',preset='direct'){
    if(!current||busy||choosing)return;
    choosing=true;
    const flowBox=box;flowBox.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{
    if(question){current.selectedQuestion=question;current.selectedPreset=preset;}
    box.querySelectorAll('.report-question-list button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===preset)));
    const id=current.id;
    event('yeonwoo_cta_clicked',id);if(preset!=='direct')event('suggested_question_clicked',id);
    if(typeof firebaseAuthReady!=='undefined'&&!firebaseAuthReady&&typeof waitForAuthSettled==='function')await waitForAuthSettled(4000).catch(()=>{});
    if(current?.id!==id)return;
    payload={id,createdAt:Date.now(),owner:uid(),profile:current.profile,question,preset,stage:'awaiting-auth',startedLoggedOut:!user()&&!(typeof getKakaoUser==='function'&&getKakaoUser())};persist();
    if(!user()&&typeof getKakaoUser==='function'&&getKakaoUser()){
      try{await ensureKakaoFirebaseSession();}catch(_){}
    }
    if(user()){await handoff();return;}
    event('signup_started_from_report',id);document.body.classList.add('report-auth-open');authOpen=true;
    auth.setAttribute('role','dialog');auth.setAttribute('aria-modal','true');auth.setAttribute('aria-label','연우 상담 로그인');
    const close=auth.querySelector('.auth-close');if(close){close.tabIndex=0;close.setAttribute('role','button');}
    openAuthModal();auth.querySelector('button')?.focus({preventScroll:true});
    }finally{choosing=false;flowBox.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  const visibility='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)&&current)event('free_report_completed',current.id);
  },{root:modal.querySelector('.saju-insight-box'),threshold:0.15}):null;
  function mount(detail){
    if(detail.type!=='profile')return;
    const profile=C.profile(detail.profile);if(!profile)return;
    current={...detail,profile,id:restoringFlowId||crypto.randomUUID()};
    event('free_report_viewed',current.id);
    box=el('section',null,'report-consultation');box.setAttribute('aria-labelledby','reportConsultTitle');
    const intro=el('div',null,'report-consultation-intro'),portrait=el('img');portrait.src='ai-consultant-poster.jpg';portrait.alt='상담사 연우';portrait.width=64;portrait.height=64;
    const title=el('h3','이 성향이 내 일상에서는 어떻게 나타날까요?');title.id='reportConsultTitle';
    intro.append(portrait,el('p','성향을 읽고, 나의 상황을 이야기하는 시간','report-consultation-kicker'),title,el('p','기본 리포트는 사주의 성향을 정리한 요약입니다. 연우에게는 지금 겪는 상황을 함께 들려주고, 왜 그런지와 어떻게 활용할지를 이어 물어볼 수 있어요.'));box.append(intro);
    const questions=el('div',null,'report-question-list');questions.setAttribute('aria-label','연우에게 물어볼 추천 질문');
    C.questions(detail).forEach(q=>{const b=el('button',q.text);b.type='button';b.dataset.preset=q.key;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>choose(q.text,q.key));questions.append(b);});box.append(questions);
    primary=el('button','연우에게 무료로 질문하기','btn btn-primary report-main-cta');primary.type='button';primary.addEventListener('click',()=>choose(current.selectedQuestion||'',current.selectedPreset||'direct'));
    note=el('p',null,'report-consultation-note');note.setAttribute('aria-live','polite');box.append(primary,note);
    const year=el('div',null,'report-newyear-note'),yearLink=el('button','2027 신년상담 구성 보기 →');yearLink.type='button';
    yearLink.addEventListener('click',()=>{
      if(busy||choosing)return;
      payload={id:current.id,createdAt:Date.now(),owner:uid(),profile:current.profile,question:'',preset:'newyear',stage:'cancelled',destination:'newyear'};persist();
      closeSajuInsight();window.openNewyearConsultation();
    });
    year.append(el('h4','다가오는 한 해를 준비하고 싶다면'),el('p','2027 신년상담은 기본 성향 요약과 별도로, 계산된 세운과 절기별 월운을 함께 살펴봅니다. 열두 달의 흐름과 실천 안내를 받아 보고 30일 동안 이어 물어보세요.'),yearLink);box.append(year);
    result.append(box);visibility?.disconnect();visibility?.observe(box);update();
  }
  window.addEventListener('taekilso:freeReportReady',e=>mount(e.detail||{}));
  window.addEventListener('taekilso:signupCreated',()=>{const p=read();if(C.signupFromReport(p,user()))event('signup_completed_from_report',p.id);});
  window.addEventListener('taekilso:aiQuestionAccepted',()=>{
    const p=read();if(p?.stage==='handed'&&p.owner===uid()&&p.conversationId===window.__aiConversationId)event('first_ai_question_sent',p.id);
  });
  new MutationObserver(()=>{
    const open=auth.style.display!=='none'&&auth.style.display!=='';
    if(authOpen&&!open){authOpen=false;document.body.classList.remove('report-auth-open');
      const p=read();
      if(user()&&p?.stage!=='cancelled')handoff();else{if(p){payload={...p,stage:'cancelled'};persist();}(box?.querySelector('[aria-pressed="true"]')||primary)?.focus({preventScroll:true});}
    }
  }).observe(auth,{attributes:true,attributeFilter:['style']});
  function cancelLogin(){const p=read();if(p?.stage==='awaiting-auth'){payload={...p,stage:'cancelled'};persist();}}
  auth.addEventListener('click',e=>{if(authOpen&&e.target.closest('.auth-close'))cancelLogin();},true);
  auth.addEventListener('keydown',e=>{
    if(!document.body.classList.contains('report-auth-open'))return;
    if(e.key==='Escape'||(e.target.classList.contains('auth-close')&&['Enter',' '].includes(e.key))){e.preventDefault();cancelLogin();closeAuthModal();return;}
    if(e.key!=='Tab')return;
    const nodes=[...auth.querySelectorAll('button,[tabindex="0"],a,input')].filter(n=>n.getClientRects().length&&!n.disabled),first=nodes[0],last=nodes.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  });
  // Google popup and same-tab Kakao redirect both settle through the existing Firebase session.
  const watch=setInterval(async()=>{
    if(document.visibilityState==='hidden')return;
    const actor=uid();
    if(actor!==lastUid){lastUid=actor;if(box)update();}
    const p=read();if(!p){document.querySelector('.report-resume-question')?.remove();return;}
    if(user()&&p.stage==='awaiting-auth')await handoff();
  },800);
  function restore(){
    const p=read();if(!p||resuming||p.stage!=='awaiting-auth')return;
    if(user()){handoff();return;}
    resuming=true;
    openSajuInsight('profile');
    const set=(id,value)=>{const n=document.getElementById(id);if(n)n.value=String(value);};
    set('insightYear',p.profile.y);set('insightMonth',p.profile.m);set('insightDay',p.profile.d);
    const toggle=document.querySelector(`#insightCalType [data-type="${p.profile.calType}"]`);if(toggle)toggle.click();
    document.getElementById('insightLeap').checked=p.profile.isLeap;
    restoringFlowId=p.id;calculateSajuInsight();restoringFlowId=null;
    // Keep the original flow identity after recomputing a local, free result.
    if(current)current.id=p.id;
    if(current&&p.question){current.selectedQuestion=p.question;current.selectedPreset=p.preset;box.querySelector(`[data-preset="${['career','money','relationships'].includes(p.preset)?p.preset:'direct'}"]`)?.setAttribute('aria-pressed','true');}
  }
  // Let the existing login callback consume ?code before deciding whether to restore a report.
  if(read())setTimeout(restore,1200);
  if(read()?.stage==='awaiting-access')offerResume();
  const signupPending=read();
  if(signupPending&&window.__lastSignupCreatedAt>=signupPending.createdAt&&C.signupFromReport(signupPending,user()))event('signup_completed_from_report',signupPending.id);
})();
