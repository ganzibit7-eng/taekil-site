/* Seasonal product and server-owned report. Existing checkout and quotas are reused. */
(() => {
  'use strict';
  const view=document.getElementById('view-newyear');
  if(!view)return;
  const status=view.querySelector('[data-year-status]'),content=view.querySelector('[data-year-content]');
  const account=view.querySelector('.newyear-account'),refresh=view.querySelector('[data-year-refresh]');
  let active=false,busy=false,timer=0,version=0,pendingChat=false,pendingQuestion='',profiles=[],progressClock=0,progressStarted=0,progressElapsed=null,draft=null,draftOwner=null;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(text,action,primary=false)=>{const b=el('button',text,'btn'+(primary?' btn-primary':''));b.type='button';b.addEventListener('click',action);return b;};
  const loggedIn=()=>!!((typeof getKakaoUser==='function'&&getKakaoUser())||(typeof firebaseAuthUser!=='undefined'&&firebaseAuthUser&&!firebaseAuthUser.isAnonymous));
  const owner=()=>typeof getCurrentUserKey==='function'?getCurrentUserKey():null;
  async function request(operation,profile){
    const accountToken=window.accountStore.snapshot();
    const actor=owner(),headers=await getAiRequestHeaders();
    if(actor!==owner()||!window.accountStore.current(accountToken))throw new Error('계정이 변경되었어요. 이용권을 다시 확인해 주세요.');
    const response=await fetch(AI_CHAT_URL,{method:'POST',headers,signal:AbortSignal.timeout(170000),body:JSON.stringify({action:'newyear-report',operation,profile})});
    const data=await response.json();
    if(actor!==owner()||!window.accountStore.current(accountToken))throw new Error('계정이 변경되었어요. 이용권을 다시 확인해 주세요.');
    if(!response.ok){const error=new Error(data.message||'신년운세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');error.code=data.error;throw error;}
    return data;
  }
  function message(text){status.textContent=text;status.setAttribute('role','status');}
  function stopProgress(){clearInterval(progressClock);progressClock=0;progressStarted=0;progressElapsed=null;content.removeAttribute('aria-busy');view.classList.remove('is-generating');}
  function updateProgressTime(){
    if(!active||!progressElapsed?.isConnected)return;
    const seconds=Math.max(0,Math.floor((Date.now()-progressStarted)/1000));
    progressElapsed.textContent='작성 경과 '+Math.floor(seconds/60)+'분 '+String(seconds%60).padStart(2,'0')+'초';
  }
  function showProgress(startedAt){
    const entering=!view.classList.contains('is-generating');view.classList.remove('has-report');view.classList.add('is-generating');if(entering)window.scrollTo({top:0,behavior:'instant'});
    progressStarted=Number(startedAt)||progressStarted||Date.now();content.setAttribute('aria-busy','true');
    if(!progressElapsed?.isConnected){
      const box=el('section',null,'newyear-progress');
      progressElapsed=el('p',null,'newyear-progress-time');
      box.append(el('h2','연우가 리포트를 작성하고 있어요'),el('p','사주를 바탕으로 한 해의 흐름과 월별 기록을 정리하고 있어요.'),progressElapsed,el('p','보통 1~2분 정도 걸려요. 완성된 리포트는 이 계정에서 다시 열 수 있어요.','newyear-muted'));
      content.replaceChildren(box);
    }
    updateProgressTime();
    if(!progressClock)progressClock=setInterval(updateProgressTime,1000);
  }
  function openYear(){goTo('newyear');}
  window.openNewyearConsultation=openYear;
  window.appendNewyearPassOffer=()=>{
    const box=el('div',null,'newyear-chat-offer');
    box.append(button('2027 신년운세 이용권 알아보기',openYear));
    document.getElementById('aiChatWindow')?.append(box);
  };
  function purchase(){
    if (!window.TaekilCheckout?.requireOpen()) return;
    if(!loggedIn()){openAuthModal();return;}
    sessionStorage.setItem('taekilso_newyear_return','1');
    payPremium();
  }
  function purchaseButton(text, primary = false) {
    const action = button(text, purchase, primary);
    action.setAttribute('data-checkout-action', '');
    return action;
  }
  function pausedNotice() {
    const note = el('p', '신규 결제를 잠시 중단했습니다.', 'checkout-pause-note');
    note.setAttribute('data-checkout-paused', '');
    return note;
  }
  function selectProfile(){
    view.classList.remove('has-report');
    stopProgress();content.style.minHeight='';content.replaceChildren();
    profiles=typeof getSajuVault==='function'?getSajuVault():[];
    try{
      const raw=JSON.parse(sessionStorage.getItem('taekilso_free_report_handoff_v1')||'null');
      const suggested=window.TaekilReportHandoff?.pending(raw,Date.now(),owner());
      if(suggested?.destination==='newyear')profiles=[{...suggested.profile,_fromFreeReport:true},...profiles];
    }catch(_){}
    content.append(el('h2','어느 분의 한 해를 살펴볼까요?'),el('p','저장된 사주를 선택하거나 여기에서 생년월일을 직접 입력해 주세요. 계정당 한 분의 리포트로 보관되므로 작성 전에 정보를 확인해 주세요.','newyear-muted'));
    const label=el('label','상담할 사주');label.htmlFor='newyearProfile';const select=el('select');select.id='newyearProfile';
    const fresh=el('option','+ 생년월일 직접 입력');fresh.value='new';select.append(fresh);
    profiles.forEach((p,i)=>{const o=el('option',`${p._fromFreeReport?'무료 리포트에서 가져온 사주':p.name||'상담자'} · ${p.y}.${p.m}.${p.d} · ${p.calType==='lunar'?'음력':'양력'}${p.isLeap?' 윤달':''}`);o.value=String(i);select.append(o);});
    select.value=profiles.length?'0':'new';
    const form=el('div',null,'newyear-profile-form');
    const childPrivacy=el('p','만 14세 미만 아동 정보는 입력하지 마세요.','privacy-input-note');
    function field(title,input){const l=el('label',title);l.htmlFor=input.id;const wrap=el('div',null,'newyear-input-field');wrap.append(l,input);return wrap;}
    const name=el('input');name.type='text';name.id='newyearName';name.placeholder='이름 또는 호칭 (선택)';name.maxLength=20;name.autocomplete='off';
    const calendar=el('select');calendar.id='newyearCalendar';for(const [value,title]of [['solar','양력'],['lunar','음력']]){const o=el('option',title);o.value=value;calendar.append(o);}
    const dateGroup=el('div',null,'newyear-date-fields');
    function picker(id,title,start,end){const s=el('select');s.id=id;const first=el('option',title+' 선택');first.value='';s.append(first);for(let n=start;n<=end;n++){const o=el('option',n+title);o.value=String(n);s.append(o);}return s;}
    const year=picker('newyearYear','년',1900,new Date().getFullYear()),month=picker('newyearMonth','월',1,12),day=picker('newyearDay','일',1,31);
    dateGroup.append(field('출생연도',year),field('월',month),field('일',day));
    const leapLabel=el('label',null,'newyear-leap'),leap=el('input');leap.type='checkbox';leap.id='newyearLeap';leapLabel.append(leap,document.createTextNode('음력 윤달에 태어났어요'));leapLabel.hidden=true;
    const hour=el('select');hour.id='newyearHour';window.TaekilBirthTime.addOptions(hour);
    const gender=el('select');gender.id='newyearGender';for(const [value,title]of [['unknown','선택 안 함'],['female','여성'],['male','남성']]){const o=el('option',title);o.value=value;gender.append(o);}
    const extra=el('div',null,'newyear-extra-fields');extra.append(field('출생시간 (선택)',hour),field('성별 (선택)',gender));
    form.append(field('이름·호칭',name),field('달력 기준',calendar),dateGroup,leapLabel,extra,el('p','시간을 몰라도 리포트를 만들 수 있어요. 확인되지 않은 시주나 대운 시작 시점은 임의로 채우지 않습니다.','newyear-muted'));
    window.TaekilDateEntry?.mountParts(dateGroup,year,month,day,'신년 리포트 생년월일');
    if(draft&&draftOwner===owner()){select.value='new';name.value=draft.name||'';calendar.value=draft.calType||'solar';year.value=String(draft.y);month.value=String(draft.m);day.value=String(draft.d);leap.checked=!!draft.isLeap;hour.value=draft.hourValue||'unknown';gender.value=draft.gender||'unknown';}
    const confirmation=el('label',null,'newyear-confirm'),check=el('input'),confirmText=document.createTextNode('선택한 생년월일을 확인했습니다. 이 사주로 나만의 신년 리포트를 작성합니다.');check.type='checkbox';confirmation.append(check,confirmText);
    const error=el('p',null,'newyear-input-error');error.setAttribute('role','alert');
    const generate=button('연우의 2027 신년 리포트 작성하기',async()=>{
      if(busy||!check.checked)return;
      let profile;
      try{
        profile=select.value==='new'?{name:name.value.trim()||'나',y:Number(year.value),m:Number(month.value),d:Number(day.value),calType:calendar.value,isLeap:calendar.value==='lunar'&&leap.checked,hourValue:hour.value,gender:gender.value}:profiles[Number(select.value)];
        if(!profile||!profile.y||!profile.m||!profile.d)throw Error('생년월일을 모두 선택해 주세요.');
        const p=profile,birth=resolveBirthDate(`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`,p.calType||'solar',!!p.isLeap);
        if(!birth)throw Error('달력 기준과 생년월일을 다시 확인해 주세요.');
        if((p.calType||'solar')==='solar'&&(birth.getFullYear()!==Number(p.y)||birth.getMonth()+1!==Number(p.m)||birth.getDate()!==Number(p.d)))throw Error('존재하지 않는 날짜예요. 생년월일을 다시 확인해 주세요.');
        if(p.calType==='lunar'){const back=Lunar.fromYmd(Number(p.y),p.isLeap?-Number(p.m):Number(p.m),Number(p.d)).getSolar().getLunar();if(back.getYear()!==Number(p.y)||back.getMonth()!==(p.isLeap?-Number(p.m):Number(p.m))||back.getDay()!==Number(p.d))throw Error('음력 날짜와 윤달 여부를 다시 확인해 주세요.');}
      }catch(e){error.textContent=e.message;check.checked=false;generate.disabled=true;return;}
      const actor=owner(),accountToken=window.accountStore.snapshot(),requestVersion=++version;
      busy=true;generate.disabled=true;
      try {
        const consent = await window.TaekilPrivacy?.confirmAI(content);
        if (!consent || !check.checked || actor!==owner() || !window.accountStore.current(accountToken) || requestVersion!==version || !active) {
          generate.disabled=!check.checked;busy=false;return;
        }
      } catch (_) {
        generate.disabled=!check.checked;busy=false;return;
      }
      if(select.value==='new'){draft={...profile};draftOwner=actor;}select.disabled=true;check.disabled=true;
      message('선택한 사주로 신년 리포트를 작성하고 있습니다.');showProgress(Date.now());
      try{const data=await request('generate',profile);if(actor===owner()&&requestVersion===version&&active)render(data);}
      catch(e){
        if(actor!==owner()||requestVersion!==version||!active)return;
        // A slow client connection must not hide a report already saved by the server.
        try{const data=await request('status');if(actor===owner()&&requestVersion===version&&active&&(data.status==='ready'||data.status==='pending')){render(data);return;}}catch(_){}
        stopProgress();selectProfile();message(e.message||'리포트를 마치지 못했어요. 다시 작성해 주세요. 추가 결제나 일반 질문 차감은 없습니다.');
      }finally{busy=false;}
    },true);
    generate.disabled=true;check.addEventListener('change',()=>{generate.disabled=!check.checked;error.textContent='';});
    function reset(){check.checked=false;generate.disabled=true;error.textContent='';form.hidden=select.value!=='new';leapLabel.hidden=calendar.value!=='lunar';if(calendar.value!=='lunar')leap.checked=false;}
    select.addEventListener('change',reset);form.addEventListener('input',reset);form.addEventListener('change',reset);reset();
    content.append(label,select,childPrivacy,form,confirmation,error,generate,el('p','리포트 작성은 일반 질문 횟수에서 차감하지 않습니다. 작성 후에는 같은 계정에서 다시 읽을 수 있어요.','newyear-muted'));
  }

  function appendReading(target,text){
    for(const paragraph of text.trim().split(/\n{2,}/))target.append(el('p',paragraph));
  }
  function appendCalculationNote(target,text){
    if(!text)return;
    const note=el('details',null,'newyear-calculation-note');
    note.append(el('summary','이 풀이의 계산 근거'));
    appendReading(note,text);
    target.append(note);
  }
  function section(title,text){const s=el('section',null,'newyear-report-section');s.append(el('h2',title));appendReading(s,text);return s;}
  function decisionGuide(guide,year){
    const focus=section('분야별로 먼저 살펴볼 시기',year+'년 달력에서 각 분야와 맞닿는 전통적 풀이가 겹치는 구간을 골랐어요. 실제 사건이 일어날 날짜나 확률을 뜻하지 않아요.');
    for(const item of guide.areas){
      const detail=el('details',null,'newyear-calculation-note');
      const first=item.windows[0];
      detail.append(el('summary',item.title+(first?' · '+first.month+'월 먼저 보기':'')));
      const windows=el('ol',null,'newyear-focus-list');
      for(const part of item.windows){
        const row=el('li');
        row.append(el('strong',part.month+'월 · '+part.theme),el('p','계산 근거 '+part.basis+' · '+part.from+'부터 '+part.untilExclusive+' 전까지'));
        windows.append(row);
      }
      if(windows.children.length)detail.append(windows);
      if(item.yearWindows?.length)detail.append(el('p','함께 볼 연도 · '+item.yearWindows.map(part=>part.year+'년 '+part.theme).join(' / '),'newyear-action'));
      detail.append(el('p',item.action,'newyear-action'));
      focus.append(detail);
    }
    const decade=section('앞으로 10년','입춘 이후 연간과 태어난 날을 비교해 해마다 점검할 주제를 정리했어요.');
    const years=el('ol',null,'newyear-focus-list');
    for(const item of guide.years){
      const row=el('li');
      row.append(el('strong',item.year+'년 · '+item.theme),el('p',item.action),el('small',item.ganZhi+' · '+item.basis));
      years.append(row);
    }
    decade.append(years);
    return {focus,decade};
  }
  function showReport(data){
    const wasGenerating=view.classList.contains('is-generating');stopProgress();view.classList.add('has-report');content.style.minHeight='';
    content.replaceChildren();const r=data.report;
    content.append(el('p','택일소 AI가 사주 계산값으로 작성한 신년 리포트','newyear-muted'));
    content.append(el('p',`${data.profile.name} 님 · ${data.profile.date} · ${window.TaekilBirthTime.label(data.profile.hourValue)}`,'newyear-report-owner'));
    const overview=section('한 해의 큰 흐름',r.overview);
    const foundation=section('나의 사주와 2027년',r.foundation);
    appendCalculationNote(foundation,r.calculationNotes?.foundation);
    const areas=el('section',null,'newyear-areas');
    areas.append(el('h2','분야별 풀이'));
    r.areas.forEach((a,index)=>{const s=section(a.title,a.reading);s.append(el('p',a.action,'newyear-action'));appendCalculationNote(s,r.calculationNotes?.areas?.[index]);areas.append(s);});
    const months=el('section',null,'newyear-months');months.append(el('h2','열두 달, 나의 흐름'));
    const contents=el('nav',null,'newyear-report-contents');
    contents.setAttribute('aria-label','신년 리포트 목차');
    const guide=data.decisionGuide?decisionGuide(data.decisionGuide,data.year):null;
    const links=[['한 해의 흐름',overview],['분야별 풀이',areas],['월별 풀이',months]];
    if(guide)links.push(['주요 시기',guide.focus],['10년 흐름',guide.decade]);
    for (const [label, target] of links) {
      const heading=target.querySelector('h2');
      heading.tabIndex=-1;
      const jump=el('button',label);
      jump.type='button';
      jump.addEventListener('click',()=>{
        heading.focus({preventScroll:true});
        heading.scrollIntoView({block:'start',behavior:'instant'});
      });
      contents.append(jump);
    }
    content.append(contents,overview,foundation,areas);
    const monthIndex=el('nav',null,'newyear-month-index');
    monthIndex.setAttribute('aria-label','월별 풀이 바로가기');
    months.append(monthIndex);
    for(const m of r.months){
      const d=el('details'),summary=el('summary');
      summary.append(el('span',String(m.month).padStart(2,'0')+'월'),el('strong',m.theme));
      d.append(summary);
      appendReading(d,m.reading);
      d.append(el('p',m.action,'newyear-action'));
      appendCalculationNote(d,m.calculationNote);
      months.append(d);
      monthIndex.append(button(m.month+'월',()=>{
        d.open=true;
        summary.focus({preventScroll:true});
        summary.scrollIntoView({block:'start',behavior:'instant'});
      }));
    }
    content.append(months);
    if(guide)content.append(guide.focus,guide.decade);
    content.append(section('기회를 살리는 방법',r.opportunities),section('조금 더 신중할 때',r.cautions),section('연우가 전하는 말',r.closing));
    const calculation=el('details',null,'newyear-calculation');calculation.append(el('summary','계산 기준과 해석 범위'));
    calculation.append(el('p',`사주에서는 입춘부터 한 해의 기준이 바뀌어요. 2027년 입춘은 ${data.calculation.annual.startsAt}이고, 이때부터 정미(丁未), 그전까지는 병오(丙午)의 해로 봐요. 열두 달은 양력 순서로 보여드리며, 각 달에서 절기로 기준이 바뀌는 시점도 반영했어요.`));
    data.calculation.limitations.forEach(t=>calculation.append(el('p',t)));content.append(calculation);
    content.append(el('p','작성된 리포트는 이용기간이 끝나도 이 계정에서 다시 읽을 수 있어요.','newyear-muted'));
    const askReport=(question='신년 리포트 내용을 제 상황에 어떻게 적용하면 좋을까요?')=>{
      pendingQuestion=question;
      pendingChat=true;
      const saved=(typeof getSajuVault==='function'?getSajuVault():[]).find(p=>
        p.calType!=='lunar'&&`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`===data.profile.date&&String(p.hourValue||'unknown')===data.profile.hourValue&&(p.gender||'unknown')===data.profile.gender);
      goTo('home');showAiChatSetupStep();fillAiChatDateSelects();refreshAiProfileSelectors();
      const p=saved||{name:data.profile.name||'나',relation:'본인',y:Number(data.profile.date.slice(0,4)),m:Number(data.profile.date.slice(5,7)),d:Number(data.profile.date.slice(8,10)),calType:'solar',isLeap:false,hourValue:data.profile.hourValue,gender:data.profile.gender};
      const values={aiChatSavedProfile:saved?.id||'',aiChatProfileName:p.name,aiChatRelation:p.relation||'본인',aiChatYear:p.y,aiChatMonth:p.m,aiChatDay:p.d,aiChatCalType:p.calType||'solar',aiChatHour:p.hourValue||'unknown',aiChatGender:p.gender||'unknown',aiChatCompareProfile:'',aiChatCompareProfile2:''};
      for(const [id,value]of Object.entries(values)){const input=document.getElementById(id);if(input)input.value=String(value);}
      document.getElementById('aiChatLeap').checked=!!p.isLeap;startAiChat({source:'newyear-report'});
    };
    if(data.access)content.append(button('리포트가 궁금하다면, 연우에게 이어 묻기',()=>askReport(),true));
    else content.append(purchaseButton('신년운세 30일 이용권 구매'), pausedNotice());
    window.TaekilExperience?.report(content,data,askReport);
    if(wasGenerating)requestAnimationFrame(()=>{
      if(!active||!overview.isConnected)return;
      overview.querySelector('h2').focus({preventScroll:true});
      content.querySelector('.newyear-report-contents')?.scrollIntoView({block:'start',behavior:'instant'});
    });
  }
  function render(data){
    clearTimeout(timer);
    if(data.status==='ready'&&data.report){message('2027 신년운세 리포트가 준비됐어요.');showReport(data);return;}
    if(!data.access){
      stopProgress();view.classList.remove('has-report');content.style.minHeight='';
      if(loggedIn()&&(data.paymentCheckRequired||(typeof isPremium==='function'&&isPremium()))){message('이용권 연결 상태를 확인해 주세요. 추가 결제부터 하실 필요는 없습니다.');content.replaceChildren(el('h2','구매하셨다면, 이용권을 다시 확인해 주세요.'),el('p','결제 직후에는 승인 기록이 계정에 연결되는 데 잠시 걸릴 수 있어요. 구매한 계정으로 로그인되어 있는지 확인해 주세요.','newyear-muted'),button('이용권 연결 다시 확인',load,true),button('문의하기',()=>goTo('support')));return;}
      message('내 2027 신년운세 리포트');
      content.replaceChildren(
        purchaseButton(loggedIn() ? '8,900원 · 신년운세 이용하기' : '로그인하고 신년운세 이용하기', true),
        pausedNotice(),
        el('p', '기존 프리미엄 30일 이용 중이라면 추가 결제 없이 포함됩니다. 추가 질문권에는 신년운세가 포함되지 않습니다.', 'newyear-muted')
      );
      if (!loggedIn()) {
        const signIn = button('로그인하고 내 리포트 확인하기', openAuthModal);
        content.append(signIn);
      }
      return;
    }
    if(data.status==='pending'){
      message('신년 리포트를 작성하고 있습니다.');showProgress(data.startedAt);
      timer=setTimeout(()=>{if(active)load();},5000);return;
    }
    stopProgress();message(data.status==='failed'?'리포트를 마치지 못했어요. 같은 이용권으로 다시 작성할 수 있으며 추가 결제는 필요하지 않습니다.':'이용권을 확인했습니다. 아래에서 사주를 확인하고 작성 버튼을 눌러 주세요.');selectProfile();
  }
  async function load(){
    const token=++version;if(typeof waitForAuthSettled==='function')await waitForAuthSettled(4000).catch(()=>{});if(token!==version||!active)return;
    refresh.hidden=!loggedIn();
    if(!loggedIn()){render({access:false,status:'none'});return;}
    if(!view.classList.contains('is-generating'))message('나의 신년운세를 확인하고 있어요.');
    try{const data=await request('status');if(token===version&&active)render(data);}
    catch(e){
      if(token!==version||!active)return;
      if(view.classList.contains('is-generating')){
        message('작성 상태를 다시 확인하고 있어요.');
        clearTimeout(timer);
        timer=setTimeout(load,5000);
        return;
      }
      message(e.message);content.replaceChildren(button('다시 확인하기',load));
    }
  }
  refresh.addEventListener('click',load);
  view.querySelector('[data-year-account-jump]').addEventListener('click',()=>{
    account.focus({preventScroll:true});
    account.scrollIntoView({block:'start',behavior:'instant'});
  });
  document.querySelectorAll('[data-open-newyear]').forEach(b=>b.addEventListener('click',openYear));
  const observe=new MutationObserver(()=>{const next=view.classList.contains('visible');if(next!==active){active=next;if(active)load();else{++version;clearTimeout(timer);clearInterval(progressClock);progressClock=0;}}});observe.observe(view,{attributes:true,attributeFilter:['class']});
  const panel=document.getElementById('aiChatPanel'),intro=document.getElementById('homeIntroOverlay');
  new MutationObserver(()=>{
    if(panel.style.display==='flex'&&pendingChat){window.__newyearChatContext=true;pendingChat=false;window.prepareAiQuestion?.(pendingQuestion);pendingQuestion='';}
    if(intro.style.display!=='none'){window.__newyearChatContext=false;pendingChat=false;}
  }).observe(document.getElementById('view-home'),{subtree:true,attributes:true,attributeFilter:['style']});
  document.getElementById('consultationExit')?.addEventListener('click',()=>{window.__newyearChatContext=false;pendingChat=false;});
  window.addEventListener('taekilso:freeReportHandoff',()=>{window.__newyearChatContext=false;pendingChat=false;});
  window.addEventListener('focus',()=>{if(active&&!busy)load();});
  let wasLoggedIn=loggedIn(),previousOwner=owner();
  function syncAuth(){
    const current=loggedIn();
    const currentOwner=owner();if(current!==wasLoggedIn||currentOwner!==previousOwner){wasLoggedIn=current;previousOwner=currentOwner;draft=null;draftOwner=null;++version;stopProgress();content.replaceChildren();if(active)load();}
  }
  const authWatch=setInterval(syncAuth,1500);
  window.addEventListener('taekilso:authChanged',syncAuth);
  // Existing payment verification remains authoritative. Only refresh the return screen.
  let returnChecks=0;
  const returnTimer=setInterval(async()=>{
    if(!sessionStorage.getItem('taekilso_newyear_return')||!loggedIn()||busy)return;
    if(++returnChecks>60){clearInterval(returnTimer);return;}
    try{const data=await request('status');if(data.access){sessionStorage.removeItem('taekilso_newyear_return');clearInterval(returnTimer);openYear();render(data);}}catch(_){}
  },5000);
  if(location.hash==='#newyear')openYear();
})();
