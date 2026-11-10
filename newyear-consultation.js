/* Seasonal product and server-owned report. Existing checkout and quotas are reused. */
(() => {
  'use strict';
  const view=document.getElementById('view-newyear');
  if(!view)return;
  const status=view.querySelector('[data-year-status]'),content=view.querySelector('[data-year-content]');
  let active=false,busy=false,timer=0,version=0,pendingChat=false,profiles=[];
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(text,action,primary=false)=>{const b=el('button',text,'btn'+(primary?' btn-primary':''));b.type='button';b.addEventListener('click',action);return b;};
  const loggedIn=()=>!!((typeof getKakaoUser==='function'&&getKakaoUser())||(typeof firebaseAuthUser!=='undefined'&&firebaseAuthUser));
  async function request(operation,profile){
    const response=await fetch(AI_CHAT_URL,{method:'POST',headers:await getAiRequestHeaders(),signal:AbortSignal.timeout(110000),body:JSON.stringify({action:'newyear-report',operation,profile})});
    const data=await response.json();
    if(!response.ok){const error=new Error(data.message||'신년상담을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');error.code=data.error;throw error;}
    return data;
  }
  function message(text){status.textContent=text;status.setAttribute('role','status');}
  function openYear(){goTo('newyear');}
  window.openNewyearConsultation=openYear;
  window.appendNewyearPassOffer=()=>{
    const box=el('div',null,'newyear-chat-offer');
    box.append(button('2027 신년상담 이용권 알아보기',openYear));
    document.getElementById('aiChatWindow')?.append(box);
  };
  function purchase(){
    if(!loggedIn()){openAuthModal();return;}
    sessionStorage.setItem('taekilso_newyear_return','1');
    payPremium();
  }
  function selectProfile(){
    content.replaceChildren();
    profiles=typeof getSajuVault==='function'?getSajuVault():[];
    content.append(el('h2','어느 분의 한 해를 살펴볼까요?'));
    const note=el('p','한 계정당 2027년 리포트 1인분입니다. 작성이 완료되면 사주를 바꿀 수 없으니 생년월일을 확인해 주세요.','newyear-muted');content.append(note);
    if(!profiles.length){content.append(button('상담할 사주 등록하기',()=>{goTo('home');showAiChatSetupStep();}));return;}
    const label=el('label','저장된 사주');label.htmlFor='newyearProfile';
    const select=el('select');select.id='newyearProfile';
    profiles.forEach((p,i)=>{const o=el('option',`${p.name||'상담자'} · ${p.y}.${p.m}.${p.d} · ${p.calType==='lunar'?'음력':'양력'}${p.isLeap?' 윤달':''}`);o.value=String(i);select.append(o);});
    const confirmation=el('label',null,'newyear-confirm'),check=el('input');check.type='checkbox';
    confirmation.append(check,document.createTextNode('선택한 사주를 확인했습니다. 이 사주로 1인 리포트를 작성합니다.'));
    const generate=button('연우의 2027 신년 리포트 작성하기',async()=>{
      if(busy||!check.checked)return;
      busy=true;generate.disabled=true;select.disabled=true;check.disabled=true;
      message('연우가 계산된 사주 흐름을 바탕으로 리포트를 작성하고 있어요. 최대 1~2분 정도 걸릴 수 있습니다.');
      try{render(await request('generate',profiles[Number(select.value)]));}
      catch(e){message(e.message);generate.disabled=false;select.disabled=false;check.disabled=false;}
      finally{busy=false;}
    },true);
    generate.disabled=true;check.addEventListener('change',()=>{generate.disabled=!check.checked;});
    content.append(label,select,confirmation,generate,el('p','리포트 작성은 일반 질문 횟수에서 차감하지 않습니다. 출생시간을 몰라도 확인된 세운과 월운으로 살펴봅니다.','newyear-muted'));
  }
  function section(title,text){const s=el('section',null,'newyear-report-section');s.append(el('h2',title),el('p',text));return s;}
  function showReport(data){
    content.replaceChildren();const r=data.report;
    content.append(el('p',`${data.profile.name} 님 · ${data.profile.date} · ${data.profile.hourValue==='unknown'?'출생시간 미상':data.profile.hourValue+'시'}`,'newyear-report-owner'));
    content.append(section('한 해의 큰 흐름',r.overview),section('나의 사주와 2027년',r.foundation));
    const areas=el('div',null,'newyear-areas');r.areas.forEach(a=>{const s=section(a.title,a.reading);s.append(el('p',a.action,'newyear-action'));areas.append(s);});content.append(areas);
    const months=el('section',null,'newyear-months');months.append(el('h2','열두 달, 나의 흐름'));
    r.months.forEach(m=>{const d=el('details'),summary=el('summary');summary.append(el('span',String(m.month).padStart(2,'0')+'월'),el('strong',m.theme));d.append(summary,el('p',m.reading),el('p',m.action,'newyear-action'));months.append(d);});content.append(months);
    content.append(section('기회를 살리는 방법',r.opportunities),section('조금 더 신중할 때',r.cautions),section('연우가 전하는 말',r.closing));
    const calculation=el('details',null,'newyear-calculation');calculation.append(el('summary','계산 기준과 해석 범위'));
    calculation.append(el('p',`2027년 정미(丁未) 세운은 입춘 ${data.calculation.annual.startsAt}부터 적용합니다. 1월부터 입춘 전까지는 병오(丙午) 세운입니다. 월별 해석은 양력 달력 기준이며 절기 경계를 함께 반영합니다.`));
    data.calculation.limitations.forEach(t=>calculation.append(el('p',t)));content.append(calculation);
    content.append(el('p','작성된 리포트는 이용기간이 끝나도 이 계정에서 다시 읽을 수 있어요.','newyear-muted'));
    if(data.access)content.append(button('리포트가 궁금하다면, 연우에게 이어 묻기',()=>{pendingChat=true;goTo('home');showAiChatSetupStep();},true));
    else content.append(el('p','이어서 대화하려면 30일 상담 이용권을 다시 구매해 주세요. 기존 리포트는 그대로 보관됩니다.'),button('30일 상담 이용권 구매',purchase));
  }
  function render(data){
    clearTimeout(timer);
    if(data.status==='ready'&&data.report){message('나만의 2027년 기록이 준비됐습니다.');showReport(data);return;}
    if(!data.access){
      message('신년상담 이용권을 구매하면 나만의 리포트를 작성할 수 있어요.');content.replaceChildren();
      content.append(button(loggedIn()?'8,900원 · 신년상담 시작하기':'로그인하고 신년상담 시작하기',purchase,true),el('p','기존 프리미엄 30일 이용 중이라면 추가 결제 없이 포함됩니다. 추가 질문권에는 신년운세가 포함되지 않습니다.','newyear-muted'));return;
    }
    if(data.status==='pending'){
      message('리포트를 작성하고 있습니다. 이 화면을 나가도 작성된 결과는 보관됩니다.');content.replaceChildren();
      timer=setTimeout(()=>{if(active)load();},5000);return;
    }
    message(data.status==='failed'?'작성을 마치지 못했어요. 아래에서 다시 시도할 수 있습니다.':'이용권을 확인했습니다. 신년 리포트를 작성해 보세요.');selectProfile();
  }
  async function load(){
    const token=++version;if(!loggedIn()){render({access:false,status:'none'});return;}
    message('나의 신년상담을 확인하고 있어요.');
    try{const data=await request('status');if(token===version&&active)render(data);}
    catch(e){if(token!==version)return;message(e.message);content.replaceChildren(button('다시 확인하기',load));}
  }
  view.querySelector('[data-year-refresh]').addEventListener('click',load);
  document.querySelectorAll('[data-open-newyear]').forEach(b=>b.addEventListener('click',openYear));
  const observe=new MutationObserver(()=>{const next=view.classList.contains('visible');if(next!==active){active=next;if(active)load();else{++version;clearTimeout(timer);}}});observe.observe(view,{attributes:true,attributeFilter:['class']});
  const panel=document.getElementById('aiChatPanel'),intro=document.getElementById('homeIntroOverlay');
  new MutationObserver(()=>{
    if(panel.style.display==='flex'&&pendingChat){window.__newyearChatContext=true;pendingChat=false;}
    if(intro.style.display!=='none'){window.__newyearChatContext=false;pendingChat=false;}
  }).observe(document.getElementById('view-home'),{subtree:true,attributes:true,attributeFilter:['style']});
  document.getElementById('consultationExit')?.addEventListener('click',()=>{window.__newyearChatContext=false;pendingChat=false;});
  window.addEventListener('focus',()=>{if(active&&!busy)load();});
  let wasLoggedIn=loggedIn();
  const authWatch=setInterval(()=>{
    const current=loggedIn();
    if(current!==wasLoggedIn){wasLoggedIn=current;if(active&&!busy)load();}
  },1500);
  // Existing payment verification remains authoritative. Only refresh the return screen.
  let returnChecks=0;
  const returnTimer=setInterval(async()=>{
    if(!sessionStorage.getItem('taekilso_newyear_return')||!loggedIn()||busy)return;
    if(++returnChecks>60){clearInterval(returnTimer);return;}
    try{const data=await request('status');if(data.access){sessionStorage.removeItem('taekilso_newyear_return');clearInterval(returnTimer);openYear();render(data);}}catch(_){}
  },5000);
  if(location.hash==='#newyear')openYear();
})();
