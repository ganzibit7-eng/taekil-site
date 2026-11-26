/* Reuses the existing free calculator, sign-in and chat. Never sends an AI question. */
(() => {
  'use strict';
  const C=window.TaekilReportHandoff;if(!C)return;
  const KEY='taekilso_free_report_handoff_v1',EVENT_KEY='taekilso_report_events_v1';
  const modal=document.getElementById('sajuInsightModal'),result=document.getElementById('sajuInsightResult'),auth=document.getElementById('authOverlay');
  if(!modal||!result||!auth)return;
  const liveSite=['taekilso.com','www.taekilso.com'].includes(location.hostname);
  if(liveSite)Object.assign(DAILY_FUNNEL_EVENT_MAP,C.events);
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
    if(liveSite && !window.TaekilMetricsPreference?.enabled())return;
    if(!C.events[name]||!id)return;
    const key=id+':'+name;let sent=[];
    try{sent=JSON.parse(sessionStorage.getItem(EVENT_KEY)||'[]');if(!Array.isArray(sent))sent=[];}catch(_){}
    if(seen.has(key)||sent.includes(key))return;
    seen.add(key);
    sent.push(key);try{sessionStorage.setItem(EVENT_KEY,JSON.stringify(sent.slice(-150)));}catch(_){}
    // No dates of birth, questions, profile names or identifiers leave this adapter.
    const emit=()=>{if(typeof isAdmin==='function'&&isAdmin())return;trackAiFunnel(name,{source:'free_report'});};
    if(liveSite&&typeof firebaseAuthSettled!=='undefined')Promise.resolve(firebaseAuthSettled).then(emit).catch(()=>{});else emit();
  }
  async function member(){
    const actor=user();if(!actor||typeof db==='undefined'||!db)return null;
    const snap=await db.collection('users').doc(actor.uid).get({source:'server'});
    if(uid()!==actor.uid)return null;
    return snap.exists?snap.data():null;
  }
  async function update(){
    const actor=uid();
    if(!box)return;
    if(!user()){
      primary.textContent='연우에게 무료로 질문하기';note.textContent='회원가입 후 AI 상담 총 3회 무료 · 카드 등록 불필요';return;
    }
    primary.textContent='이용 상태 확인 중…';
    try{const state=C.availability(await member());if(!box||uid()!==actor)return;primary.textContent=state.label;note.textContent=state.note;}
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
      window.__freeReportSnapshot=p.reportSnapshot||window.__freeReportSnapshot;
      document.querySelector('.report-resume-question')?.remove();
      closeSajuInsight();closeAuthModal();document.body.classList.remove('report-auth-open');
      window.__newyearChatContext=false;
      window.dispatchEvent(new CustomEvent('taekilso:freeReportHandoff'));
      goTo('home');showAiChatSetupStep();
      const set=(id,value)=>{const n=document.getElementById(id);if(n)n.value=String(value);};
      const saved=C.matchingProfile(typeof getSajuVault==='function'?getSajuVault():[],p.profile);
      set('aiChatSavedProfile',saved?.id||'');set('aiChatProfileName',saved?.name||'나');set('aiChatRelation',saved?.relation||'본인');set('aiChatCalType',p.profile.calType);
      set('aiChatYear',p.profile.y);set('aiChatMonth',p.profile.m);set('aiChatDay',p.profile.d);set('aiChatHour','unknown');set('aiChatGender','unknown');
      const leap=document.getElementById('aiChatLeap');if(leap)leap.checked=p.profile.isLeap;
      ['aiChatCompareProfile','aiChatCompareProfile2'].forEach(id=>set(id,''));
      await startAiChat({source:'free-report'});
      if (uid()!==actor.uid || document.getElementById('aiChatPanel').style.display!=='flex') return;
      payload={...p,owner:actor.uid,stage:'handed',handedAt:Date.now()};persist();
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
    payload={id,createdAt:Date.now(),owner:uid(),profile:current.profile,reportSnapshot:window.__freeReportSnapshot||null,question,preset,stage:'awaiting-auth',startedLoggedOut:!user()&&!(typeof getKakaoUser==='function'&&getKakaoUser())};persist();
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
    if(!restoringFlowId)window.TaekilCampaign?.activity('basicResult');
    const daily={
      목:['첫걸음을 정할 때','아무도 먼저 나서지 않는 자리에서 작은 시작점을 찾아내는 쪽으로 읽어요. 일을 끝낸 뒤보다 무엇을 해볼 수 있을지 이야기하는 순간에 표정이 먼저 밝아지는지 떠올려 보세요.','관심 가는 일이 겹친다면 가장 먼저 시작한 일의 다음 한 걸음을 짚어 보세요. 새로 벌이는 재미와 이미 자라난 것을 돌보는 보람 중 어느 쪽이 지금 더 필요한지 보여요.'],
      화:['마음이 밖으로 드러날 때','좋았던 것을 바로 말해 주면 상대가 편안해지는 장면을 떠올려 보세요. 전통적으로 화는 밖으로 드러나는 성질을 읽어서, 내가 표현해야 비로소 주변에도 전해지는 힘에 주목해요.','반응이 더딘 날에는 내가 한 말의 온도와 상대가 답할 수 있는 속도를 따로 살펴봐요. 말을 더 보태기보다 한 박자 기다렸을 때 대화가 살아난 순간도 이 성향을 이해하는 실마리예요.'],
      토:['두 가지 요구 사이에 설 때','서로 원하는 것이 다른 두 사람이 내게 이야기를 꺼낸 장면을 떠올려 보세요. 토에서는 한쪽을 빨리 고르는 힘보다 각자 기댈 만한 자리를 만드는 힘을 먼저 읽어요.','누군가 편안해진 뒤에도 내가 계속 그 일을 떠맡고 있다면 균형을 다시 볼 때예요. 내가 맡기로 한 부분과 잠시 도와준 부분을 구분하면 내 성향을 더 편하게 쓸 수 있어요.'],
      금:['기준을 세우고 선택할 때','여러 방법을 비교하다가 꼭 지키고 싶은 조건 하나를 발견하는 장면이에요. 금에서는 남은 선택지를 줄이면서 중요한 것을 선명하게 만드는 힘을 읽어요.','판단을 전해야 할 때에는 결론을 말하기 전에 어떤 점을 소중히 봤는지 한마디 덧붙여 보세요. 같은 선택도 상대에게는 거절로, 또는 지킬 약속으로 다르게 들릴 수 있어요.'],
      수:['상황이 달라진 다음을 읽을 때','처음 들은 설명보다 대화가 끝난 뒤에야 앞뒤가 맞아떨어지는 경험을 떠올려 보세요. 수에서는 바로 반응하는 힘보다 흩어진 단서를 모아 다음 방향을 읽는 힘에 주목해요.','생각이 길어질 때에는 이미 확인한 것과 더 알아보고 싶은 것을 나눠 보세요. 한 가지를 물어보는 것만으로도 고민을 더 깊게 할지, 움직여 볼지가 달라질 수 있어요.']
    }[detail.element];
    const next=result.querySelector('.sir-cta');
    if(daily&&next){
      const part=el('section',null,'sir-daily-reading');
      part.append(el('h3',daily[0]),el('p','태어난 날의 '+detail.element+' 기운을 일상에 비춰 볼게요. '+daily[1]),el('p',daily[2]));
      next.before(part);
    }
    box=el('section',null,'report-consultation');box.setAttribute('aria-labelledby','reportConsultTitle');
    const intro=el('div',null,'report-consultation-intro'),portrait=el('img');portrait.src='ai-consultant-poster.jpg';portrait.alt='상담사 연우';portrait.width=64;portrait.height=64;
    const title=el('h3','이 성향이 내 일상에서는 어떻게 나타날까요?');title.id='reportConsultTitle';
    intro.append(portrait,el('p','성향을 읽고, 나의 상황을 이야기하는 시간','report-consultation-kicker'),title,el('p','기본 리포트는 사주의 성향을 정리한 요약입니다. 연우에게는 지금 겪는 상황을 함께 들려주고, 왜 그런지와 어떻게 활용할지를 이어 물어볼 수 있어요.'));box.append(intro);
    const questions=el('div',null,'report-question-list');questions.setAttribute('aria-label','연우에게 물어볼 추천 질문');
    C.questions(detail).forEach(q=>{const b=el('button',q.text);b.type='button';b.dataset.preset=q.key;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>choose(q.text,q.key));questions.append(b);});box.append(questions);
    primary=el('button','연우에게 무료로 질문하기','btn btn-primary report-main-cta');primary.type='button';primary.addEventListener('click',()=>choose(current.selectedQuestion||'',current.selectedPreset||'direct'));
    note=el('p',null,'report-consultation-note');note.setAttribute('aria-live','polite');box.append(primary,note);
    const year=el('div',null,'report-newyear-note'),yearLink=el('button','2027 신년운세 이용 안내 →');yearLink.type='button';
    yearLink.addEventListener('click',()=>{
      if(busy||choosing)return;
      payload={id:current.id,createdAt:Date.now(),owner:uid(),profile:current.profile,question:'',preset:'newyear',stage:'cancelled',destination:'newyear'};persist();
      closeSajuInsight();window.openNewyearConsultation();
    });
    year.append(el('h4','다가오는 한 해를 준비하고 싶다면'),el('p','2027 신년운세는 기본 성향 요약과 별도로, 계산된 세운과 절기별 월운을 함께 살펴봅니다. 한 달 예시를 먼저 읽고, 원하면 6,900원에 열두 달 전체를 열 수 있어요.'),yearLink);box.append(year);
    const reports=el('a','연애·재물·재회·직업 리포트 둘러보기 →');
    reports.href='/#home';
    reports.addEventListener('click',e=>{
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      if(document.documentElement.dataset.homeLayout!=='directory')return;
      e.preventDefault();closeSajuInsight();goTo('home');
      const title=document.getElementById('directoryTopicsTitle');
      title.focus({preventScroll:true});title.scrollIntoView({block:'start'});
    });
    year.append(reports);
    result.append(box);
    const reportHead=result.querySelector('.sir-head');
    if(reportHead&&window.TaekilReportGuide){
      const first=result.querySelector('.sir-title'),scene=result.querySelector('.sir-daily-reading h3');
      const descriptions={[title.textContent]:'마음에 남은 대목을 골라 연우에게 이어서 물어볼 수 있어요.'};
      if(first)descriptions[first.textContent]='태어난 날의 오행으로 읽은 강점과 주의할 점을 살펴봐요.';
      if(scene)descriptions[scene.textContent]='내 오행의 특징이 일상의 선택에서 어떻게 드러나는지 읽어요.';
      reportHead.after(window.TaekilReportGuide.documentIndex([first,scene,title],descriptions));
    }
    visibility?.disconnect();visibility?.observe(box);update();
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
    restoringFlowId=p.id;calculateSajuInsight({restore:true});restoringFlowId=null;
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
