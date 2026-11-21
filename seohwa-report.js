(() => {
  'use strict';
  const catalog=window.TaekilFeaturedReports, client=window.TaekilAccountReport, checkout=window.TaekilCheckout;
  const defaultReading=catalog.forId('seohwa');
  const endpoint='https://taekilso-api-jhqz3vlila-du.a.run.app/api/';
  const pendingKey=reading=>reading===defaultReading?'seohwa-pending-report-v1':'featured-pending-report-v1-'+reading.id;
  const restoreKey='taekilso_resume_seohwa_report_v1';
  const by=id=>document.getElementById(id);
  const dialog=by('seohwaReportDialog'), body=by('seohwaReportBody');
  const writingVisual=by('seohwaWritingVisual');
  let writingFilm=writingVisual.querySelector('video');
  const progress=by('seohwaReportProgress');
  const library=by('seohwaReportList'), libraryStatus=by('seohwaLibraryStatus');
  const returnView=by('view-seohwa-report'), returnHost=by('seohwaReturnHost');
  const returnStatus=by('seohwaReturnStatus'), returnRetry=by('seohwaReturnRetry'), returnAuth=by('seohwaReturnAuth');
  const returnLink=by('seohwaReturnLink');
  let active, loadingLibrary=0, accountOwner=accountStore.owner(), waitingLogin=false;
  let returnAttempt=null;
  let progressTimer=0, statusTimer=0, previewTimer=0;
  const typicalWriteSeconds=60;
  const estimatedWriteMs=(typicalWriteSeconds+10)*1000;
  const previewWaitMs=10000;
  const won=new Intl.NumberFormat('ko-KR');
  const withName=reading=>reading.name+(reading===defaultReading?'와':'과');
  const reportGuides={
    seohwa:{
      chart:'연애 풀이를 시작하는 내 사주표',
      title:'사랑받는다고 느끼는 순간은 저마다 달라요',
      intro:'서화는 내 사주에서 마음을 표현하는 방식과 마음이 놓이는 조건을 살펴봐요. 같은 늦은 답장에도 약속이 바뀌어서 서운한 사람과 내 마음을 알아주지 않아 서운한 사람이 있지요.',
      lenses:{peer:'내 마음을 정리하는 방식',expression:'마음을 전하는 방식',practical:'행동에서 느끼는 애정',trust:'약속에서 얻는 안심',support:'마음을 열게 하는 대화'},
      prompts:{peer:'내가 잠깐 생각할 시간을 받으면, 어떤 말을 더 편하게 할 수 있나요?',expression:'서운한 일을 그 자리에서 말했을 때와 나중에 말했을 때, 어떤 차이가 있었나요?',practical:'상대의 말과 행동 중 무엇이 달라졌을 때 마음이 놓였나요?',trust:'함께 정한 약속 중 다시 지켜졌을 때 유난히 안심됐던 일이 있나요?',support:'조언을 들었을 때와 내 말을 끝까지 들어줬을 때, 어느 순간에 마음이 더 열렸나요?'}
    },
    dogyeom:{
      chart:'재물운을 읽는 내 사주표',
      title:'돈을 버는 힘과 남기는 힘을 나눠 봐요',
      intro:'도겸은 내 사주에서 어떤 일을 할 때 보상으로 이어지기 쉬운지, 돈을 관리할 때 어디에 힘을 쓰는지 살펴봐요. 같은 금액을 벌어도 시간이나 먼저 내는 비용이 다르면 내 손에 남는 몫은 달라져요.',
      lenses:{peer:'돈의 조건을 정하는 방식',expression:'내 결과물에 값을 붙이는 힘',practical:'실제로 남는 몫을 보는 감각',trust:'정한 대가를 꾸준히 받는 기준',support:'쌓아온 경험을 돈으로 잇는 방식'},
      prompts:{peer:'내가 스스로 단가나 조건을 정했던 일은 어떤 점이 달랐나요?',expression:'내가 한 일 중 결과물 자체에 값을 지불한 사람이 있었나요?',practical:'최근 수입 중 시간과 비용까지 빼고도 다시 해보고 싶은 일은 무엇인가요?',trust:'같은 일을 반복해도 정산 조건이 분명할 때와 그렇지 않을 때 내 몫은 어떻게 달랐나요?',support:'새로 배우거나 준비물을 사지 않아도 지금 있는 경험으로 대가를 받을 수 있는 일은 무엇인가요?'}
    },
    ijun:{
      chart:'재회 풀이를 시작하는 내 사주표',
      title:'그 사람을 그리워할 때, 무엇이 먼저 떠오르나요?',
      intro:'이준은 헤어짐을 받아들이는 방식과 마음을 다시 꺼내고 싶어지는 순간을 내 사주에서 읽어요. 요즘 그 사람과 하고 싶은 말이 예전에도 미처 끝내지 못했던 말인지부터 살펴보면, 재회 풀이의 맥락이 더 잘 보여요.',
      lenses:{peer:'관계를 되돌아보는 나만의 시간',expression:'미처 전하지 못한 마음',practical:'기억에 남은 일상의 배려',trust:'다시 마주할 지난 약속',support:'이별의 이유를 받아들이는 방식'},
      prompts:{peer:'혼자 시간을 보내며 내린 결론 중 상대의 이야기를 더 들어보고 싶은 부분은 무엇인가요?',expression:'지금 건넬 말을 안부, 사과, 다시 대화하자는 제안 중 하나로 줄인다면 무엇이 남나요?',practical:'그 사람이 그리울 때 함께했던 일상 중 어떤 장면이 먼저 떠오르나요?',trust:'다정했던 기억이 떠오를 때도 그대로 마음에 걸리는 지난 약속이 있나요?',support:'이별 뒤 실제로 들은 말과 내가 짐작한 이유를 나눠보면 무엇이 남나요?'}
    },
    mujin:{
      chart:'직업운을 읽는 내 사주표',
      title:'직함보다 내가 잘하는 장면부터 찾아요',
      intro:'무진은 내 사주에서 판단하는 방식과 결과를 내기 쉬운 환경을 살펴봐요. 같은 직무라도 일을 정하는 사람이 누구인지, 피드백을 언제 받는지에 따라 내 강점이 드러나는 순간이 달라져요.',
      lenses:{peer:'내가 직접 판단할 수 있는 범위',expression:'아이디어를 결과로 만드는 힘',practical:'계획을 실제 일로 옮기는 방식',trust:'책임과 평가가 맞물리는 조건',support:'경험과 도움을 얻는 환경'},
      prompts:{peer:'일의 순서를 내가 정할 수 있을 때 가장 빨리 풀었던 문제는 무엇이었나요?',expression:'막연한 요구를 눈에 보이는 결과로 바꿨을 때, 누구의 반응이 다음 일을 더 낫게 했나요?',practical:'최근 일을 현실적인 계획으로 바꿨을 때 시간, 예산, 사람 중 무엇부터 정했나요?',trust:'책임의 경계와 평가 기준이 분명했을 때 평소보다 잘해낸 일은 무엇인가요?',support:'일이 막혔을 때 좋은 사례를 참고하거나 질문할 사람이 있어서 풀렸던 적이 있나요?'}
    }
  };
  function request(reading,payload,owner,timeout){
    if(reading===defaultReading)return client.request(endpoint+'seohwa-report',payload,owner,timeout);
    return client.request(endpoint+'featured-report',{...payload,...(reading&&{consultantId:reading.id})},owner,timeout);
  }
  function displayTitle(reading){
    dialog.setAttribute('aria-label',reading.title);
    dialog.querySelector('.sr-toolbar span').textContent=reading.title;
    dialog.dataset.advisor=reading.id;
  }
  function checkoutPath(reading,orderId){
    const query=reading===defaultReading?new URLSearchParams({seohwaReport:'1'}):new URLSearchParams({featuredReport:reading.id});
    if(orderId)query.set(reading===defaultReading?'seohwaOrder':'reportOrder',orderId);
    return '/?'+query+'#seohwa-report';
  }
  function readingAtReturn(url){
    return catalog.forId(url.searchParams.get('featuredReport'))||defaultReading;
  }
  function el(tag,text,cls) {
    const node=document.createElement(tag);
    if(text!=null)node.textContent=text;
    if(cls)node.className=cls;
    return node;
  }
  function button(text,cls,fn) {
    const node=el('button',text,cls);
    node.type='button';
    node.addEventListener('click',fn);
    return node;
  }
  function clearGenerationTimers() {
    clearInterval(progressTimer);
    clearTimeout(statusTimer);
    clearTimeout(previewTimer);
  }
  function pauseWritingFilm() {
    writingFilm.hidden=true;
    writingFilm.pause();
  }
  function prepareWritingVisual(reading){
    writingVisual.hidden=false;
    pauseWritingFilm();
    writingFilm=writingVisual.querySelector('video[data-advisor="'+reading.id+'"]');
    for(const poster of writingVisual.querySelectorAll('img[data-advisor]'))poster.hidden=poster.dataset.advisor!==reading.id;
    pauseWritingFilm();
    if(writingFilm.currentTime>0)writingFilm.currentTime=0;
    return writingVisual;
  }
  function close() {
    clearGenerationTimers();
    pauseWritingFilm();
    if(dialog.open)dialog.close();
    active=null;
    body.replaceChildren();
  }
  by('closeSeohwaReport').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('scroll',()=>{
    progress.value=dialog.scrollTop/Math.max(1,dialog.scrollHeight-dialog.clientHeight);
  },{passive:true});

  function paper(chapter,index,followup,reading) {
    const page=el('article',null,'sr-paper');
    page.id='seohwa-report-chapter-'+index;
    const h=el('h3',chapter.title);
    h.tabIndex=-1;
    page.append(el('p',index===0?'첫 장':'제 '+(index+1)+'장','sr-page-label'),h,el('p',chapter.highlight,'sr-highlight'));
    if(chapter.sections)for(const section of chapter.sections){
      page.append(el('h4',section.title));
      for(const text of section.text.split('\n'))page.append(el(section.quote?'blockquote':'p',text));
    }
    else for(const paragraph of chapter.paragraphs)page.append(el('p',paragraph));
    const basis=Array.isArray(chapter.basis)?chapter.basis[0]:chapter.basis;
    if(basis){
      const details=el('details',null,'sr-evidence');
      details.append(el('summary','이 장에 사용한 사주 근거'),el('p',basis.location+' · '+basis.natal+' · '+basis.term),
        el('p',basis.meaning+'으로 풀었어요.'));
      page.append(details);
    }
    if(followup) page.append(button('이 대목으로 '+reading.name+'에게 묻기','sr-ask',followup));
    return page;
  }

  function header(reading,choice,day,known) {
    const head=el('header',null,'sr-cover');
    const image=el('img');
    image.src='/'+window.TaekilConsultationPersonas.get(reading.id).portrait; image.alt='';
    image.width=640; image.height=800;
    head.append(image);
    const title=el('div',null,'sr-cover-text');
    const heading=el('h2',reading.cover);
    heading.tabIndex=-1;
    title.append(el('p',reading.title,'sr-kicker'),heading,
      el('p',reading.stories[choice].label+(day?' · '+day+'일주':'')+
        (known===false?' · 출생시간 미상, 공통 근거로 풀이':'')));
    title.append(button('내 풀이 바로 보기','sr-personal-jump',()=>jumpToChapter(0)));
    head.append(title);
    return head;
  }
  function jumpToChapter(index){
    const heading=by('seohwa-report-chapter-'+index)?.querySelector('h3');
    heading?.focus({preventScroll:true});
    heading?.scrollIntoView({block:'start',behavior:'instant'});
  }
  function introGuide(reading,context,first){
    const {chart,chapter,comparison,explainer,readGanZhi}=window.TaekilReportGuide;
    const guide=el('div',null,'report-pillar-guide sr-report-guide');
    const topic=reportGuides[reading.id];
    const firstChapter=chart({pillars:context.pillars,hourKnown:context.known,title:topic.chart,heading:'h3'});
    const second=chapter(2,topic.title,topic.intro,'h3');
    const basis=Array.isArray(first.basis)?first.basis[0]:first.basis;
    const pillar=readGanZhi(basis?.natal);
    const label={연:'연주',월:'월주',일:'일주',시:'시주'}[basis?.location?.[0]];
    if(label&&pillar&&basis.term){
      const lens=topic.lenses[basis.family];
      second.append(el('p','일간과 다른 글자 사이의 관계를 읽는 이름이 ‘십성’이에요. 이 리포트에서 먼저 살펴본 기둥과 그 풀이에 쓰인 이름을 아래에 표시했어요.'),
        comparison([
          ['본문에서 먼저 살펴볼 기둥',label+' · '+pillar.name+'('+pillar.hanja+')'],
          [basis.term,lens||'일간과의 관계를 읽는 이름']
        ]));
    }
    const prompt=topic.prompts[basis?.family];
    if(prompt)second.append(explainer(prompt));
    guide.append(firstChapter,second);
    return guide;
  }
  function profileBirthDay(profile){
    if(!profile)return null;
    const date=resolveBirthDate([profile.y,String(profile.m).padStart(2,'0'),String(profile.d).padStart(2,'0')].join('-'),profile.calType,profile.isLeap);
    return date?[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'):null;
  }
  function purchasedContext(reading,report){
    const known=report.known??(report.profile?.hourValue?report.profile.hourValue!=='unknown':undefined);
    try{
      const birth=profileBirthDay(report.profile);
      if(birth&&window.Solar&&window.LunarUtil){
        const context=reading.timeSlots(birth,report.profile.hourValue,window.Solar,window.LunarUtil);
        if(!report.day||context.day===report.day)return context;
      }
    }catch{}
    return {known,pillars:report.calendar?.pillars??{day:report.day}};
  }

  function lockIcon() {
    const namespace='http://www.w3.org/2000/svg';
    const icon=document.createElementNS(namespace,'svg');
    icon.setAttribute('class','sr-lock');
    icon.setAttribute('role','img');
    icon.setAttribute('aria-label','잠긴 장');
    icon.setAttribute('viewBox','0 0 20 20');
    const shape=document.createElementNS(namespace,'path');
    shape.setAttribute('d','M6.5 8V6a3.5 3.5 0 1 1 7 0v2M5 8h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm5 4v2');
    icon.append(shape);
    return icon;
  }

  function toc(reading,first,locked) {
    const list=el('nav',null,'sr-toc');
    list.setAttribute('aria-label','리포트 목차');
    list.append(el('h3','리포트 목차'));
    const rows=el('ol');
    for(const [index,title] of [first.title,...reading.chapters].entries()){
      const row=el('li');
      if(locked&&index>0){
        const chapter=el('div');
        chapter.append(el('strong',title),el('small',reading.guide[index-1]));
        row.className='sr-locked-row';
        row.append(lockIcon(),chapter);
      }else{
        row.append(button(title,'sr-jump',()=>jumpToChapter(index)));
        if(locked)row.append(el('small','무료로 읽을 수 있어요'));
      }
      rows.append(row);
    }
    list.append(rows);
    return list;
  }
  function show(nodes,preserve=false) {
    const scroll=preserve?dialog.scrollTop:0;
    body.replaceChildren(...nodes);
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=scroll;
  }
  function setStatus(node,message){
    node.textContent=message;
  }

  function drawPreview(data) {
    const {first,context,choice,excerpts,reading}=data;
    displayTitle(reading);
    const layout=el('div',null,'sr-layout'), contents=el('div',null,'sr-pages'), gate=el('section',null,'sr-gate');
    const status=el('p',null,'sr-status');
    status.setAttribute('role','status');
    const pay=button(won.format(reading.PRICE)+'원에 전체 리포트 열기','sr-primary',()=>buy(data,status));
    pay.dataset.checkoutAction='';
    const paused=el('p','현재 전체 리포트 구매를 잠시 중단했어요.','sr-payment-note');
    paused.dataset.checkoutPaused='';
    const paymentNote=el('p',null,'sr-payment-note report-offer-price');
    paymentNote.dataset.checkoutAction='';
    paymentNote.append(el('strong',won.format(reading.PRICE)+'원'),el('span','1회 결제 · 자동 갱신 없음'));
    const benefits=el('ul',null,'sr-benefits');
    for(const [title,description] of [
      ['개인 사주 풀이 6장','무료 첫 장과 함께 사주표 읽기 안내 2장까지 내 기록에서 다시 읽을 수 있어요.'],
      [withName(reading)+' 채팅 상담 3회','리포트 구매 후, 마음에 남은 대목에서 바로 이어서 물어볼 수 있어요.']
    ]){
      const benefit=el('li');
      benefit.append(el('strong',title),el('span',description));
      benefits.append(benefit);
    }
    gate.append(el('h3','전체 리포트와 '+reading.name+' 상담'),benefits,paymentNote,pay,status,paused);
    const samples=el('section',null,'sr-samples');
    samples.setAttribute('aria-labelledby','sr-sample-title');
    const label=el('h3','이어지는 장 미리보기');
    label.id='sr-sample-title';
    samples.append(label);
    for(const {index,text} of excerpts){
      const sample=el('article',null,'sr-sample');
      sample.append(el('h4',reading.chapters[index]),el('p',text),
        el('p','이 장의 첫 문단을 공개했어요.','sr-excerpt-label'));
      samples.append(sample);
    }
    contents.append(introGuide(reading,context,first),paper(first,0),samples,gate);
    layout.append(toc(reading,first,true),contents);
    show([header(reading,choice,context.day,context.known),layout]);
  }

  function openPreview({profile,choice,auth,topic='love'}) {
    const reading=catalog.forTopic(topic);
    if(!reading)return;
    const day=profileBirthDay(profile);
    if(!day)return;
    const today=new Date(Date.now()+9*3600000);
    const cutoff=new Date(Date.UTC(today.getUTCFullYear()-14,today.getUTCMonth(),today.getUTCDate()));
    if(day>cutoff.toISOString().slice(0,10))throw Error('만 14세 미만의 출생 정보는 사용할 수 없어요.');
    const context=reading.timeSlots(day,profile.hourValue,window.Solar,window.LunarUtil);
    const data={reading,profile,choice,auth,context,first:reading.first(context,choice),excerpts:reading.excerpts(context,choice),host:by('aiChatSetup'),owner:accountStore.snapshot()};
    active=data;
    preparePreview(data);
  }
  function finishPreview(data){
    if(active!==data||!data.previewPending)return;
    if(!dialog.open||!data.host.closest('.view')?.classList.contains('visible')||!accountStore.current(data.owner)){
      close();
      return;
    }
    clearGenerationTimers();
    pauseWritingFilm();
    data.previewPending=false;
    drawPreview(data);
    body.querySelector('.sr-cover h2').focus({preventScroll:true});
  }
  function preparePreview(data){
    clearGenerationTimers();
    data.previewPending=true;
    displayTitle(data.reading);
    const panel=el('section',null,'sr-generation sr-preview-generation');
    const copy=el('div',null,'sr-generation-copy');
    const title=el('h2','무료 미리보기를 준비하고 있어요');
    const bar=el('progress');
    bar.max=previewWaitMs;
    bar.value=0;
    bar.className='sr-preview-progress';
    bar.setAttribute('aria-label','무료 미리보기 준비 진행률');
    copy.append(title,el('p','입력한 출생 정보에 맞춰 사주표와 첫 풀이를 준비해요.','sr-status'),bar,
      el('p','약 10초 · 내 사주표와 첫 풀이','sr-generation-next'));
    panel.append(prepareWritingVisual(data.reading),copy);
    show([panel]);
    writingFilm.hidden=false;
    const start=performance.now();
    progressTimer=setInterval(()=>{
      if(active!==data||!dialog.open||!data.host.closest('.view')?.classList.contains('visible')){
        if(active===data)close();
        return;
      }
      bar.value=Math.min(previewWaitMs,performance.now()-start);
    },150);
    previewTimer=setTimeout(()=>finishPreview(data),previewWaitMs);
  }
  async function buy(data,status) {
    const {reading}=data;
    if(!checkout.requireOpen()) {setStatus(status,'현재는 무료 첫 장을 읽을 수 있어요. 신규 결제는 잠시 중단했어요.');return;}
    const owner=accountStore.snapshot();
    if(!owner.owner){
      try {sessionStorage.setItem(restoreKey,'1');} catch {}
      waitingLogin=true; close();
      if(!data.auth()){
        waitingLogin=false;
        try{sessionStorage.removeItem(restoreKey);}catch{}
        active=data;drawPreview(data);showToast('출생 정보 임시 저장을 확인해 주세요.');
      }
      return;
    }
    await checkout.run(async()=>{
      const sameUser=()=>active===data&&accountStore.current(owner)&&data.host.closest('.view')?.classList.contains('visible');
      const current=()=>sameUser()&&dialog.open;
      let closedForConsent=false;
      try {
        setStatus(status,'저장된 리포트와 결제 상태를 확인하고 있어요.');
        const result=await request(reading,{operation:'prepare',comparison:{profile:data.profile,choice:data.choice},allowResume:true},owner);
        if(!current()) return false;
        if(result.id && ['paid','generating','ready'].includes(result.state)){
          await renderPurchased(result,data.host,owner,false,reading);return false;
        }
        if(result.state==='paused'){setStatus(status,'신규 결제를 잠시 중단했어요.');return false;}
        dialog.close();
        closedForConsent=true;
        const agreed=await window.TaekilPrivacy.confirmAI(data.host);
        if(!sameUser())return false;
        dialog.showModal();
        closedForConsent=false;
        if(!agreed){setStatus(status,'본편은 AI 풀이로 만들어져요. 동의하시면 결제를 이어갈 수 있어요.');return false;}
        setStatus(status,'페이앱 결제창에 연결하고 있어요.');
        if(!await checkout.loadSdk()){
          if(current())setStatus(status,'결제창에 연결하지 못했어요. 잠시 후 다시 눌러 주세요.');
          return false;
        }
        if(!current())return false;
        const order=await request(reading,{operation:'prepare',comparison:{profile:data.profile,choice:data.choice},checkout:true,allowResume:true},owner);
        if(!current())return false;
        if(order.id && ['paid','generating','ready'].includes(order.state)){await renderPurchased(order,data.host,owner,false,reading);return false;}
        if(order.state==='resume'){client.showResume(status,order,pendingKey(reading));return false;}
        if(order.state==='pending'){
          accountStore.setItem(pendingKey(reading),order.id);
          close();
          goTo('seohwa-report');
          history.replaceState(history.state,'',checkoutPath(reading));
          return false;
        }
        if(order.state==='paused'){setStatus(status,'신규 결제를 잠시 중단했어요.');return false;}
        const returnPath=checkoutPath(reading,order.orderId);
        const opened=client.pay(order,{price:reading.PRICE,name:reading.NAME,payAppName:reading.paymentName,
          pendingKey:pendingKey(reading),returnPath,memo:reading.title+' 및 후속 상담 3회'});
        if(!opened)setStatus(status,'결제창을 열지 못했어요. 결제 상태를 다시 확인해 주세요.');
        return opened;
      }catch(error){
        if(sameUser()&&closedForConsent)dialog.showModal();
        if(current())setStatus(status,error.message);
        return false;
      }
    });
  }
  const wealthTimingLabels={income:'수입을 넓혀보기 좋은 구간',margin:'번 돈을 남기기 좋은 구간',risk:'내 몫이 줄기 쉬운 구간'};
  function wealthJudgment(judgment) {
    const article=el('section',null,'sr-wealth-judgment');
    article.append(el('h4','도겸이 먼저 짚은 재물 흐름'),el('p',judgment.route.title,'sr-wealth-route'),el('p',judgment.route.description));
    const routeBasis=el('details',null,'sr-evidence');
    routeBasis.append(el('summary','재물 흐름을 읽은 근거'),el('p',judgment.route.basis));
    article.append(routeBasis);
    for(const item of judgment.timing){
      const card=el('section',null,'sr-wealth-timing');
      const basis=el('details',null,'sr-evidence');
      basis.append(el('summary','이 시기를 고른 근거'),el('p',item.ganZhi+' 월운 · '+item.basis),
        el('p',item.from+'부터 '+item.untilExclusive+' 직전까지'));
      card.append(el('h5',wealthTimingLabels[item.kind]),el('p',item.title,'sr-wealth-window'),el('p',item.talk),el('p',item.action),basis);
      article.append(card);
    }
    article.append(el('p','시기는 명식과 2027년 절기를 대조한 전통 명리 해석이에요.','sr-wealth-caption'));
    return article;
  }

  function calendarArticle(calendar) {
    const article=el('section',null,'sr-wealth-calendar');
    article.append(el('h4',calendar.year+'년 재물 달력'),el('p','달마다 가장 긴 절기 구간을 기준으로, 돈을 벌고 지키는 데 살펴볼 점을 정리했어요.'));
    const chart=el('dl',null,'sr-wealth-pillars');
    for(const [key,label] of [['year','연주'],['month','월주'],['day','일주'],['hour','시주']]){
      const pair=el('div');
      pair.append(el('dt',label),el('dd',calendar.pillars?.[key]||'미확인'));
      chart.append(pair);
    }
    article.append(chart);
    if(!calendar.judgment){
      const focuses=el('div',null,'sr-wealth-focuses');
      for(const item of calendar.focuses){
        const focus=el('section');
        focus.append(el('h5',item.title),el('p',item.reason),el('p',item.action),el('p',item.check));
        focuses.append(focus);
      }
      article.append(el('h4','특히 눈여겨볼 시기'),focuses);
    }
    const months=el('details',null,'sr-evidence');
    months.open=true;
    months.append(el('summary','열두 달 장부'));
    const list=el('dl',null,'sr-wealth-months');
    for(const row of calendar.rows){
      const group=el('div'), description=el('dd');
      description.append(el('strong',row.label),el('p',row.action),el('small',row.ganZhi+' · '+row.term+(row.clash?' · 변화가 잦을 때 조건 재확인':'')));
      group.append(el('dt',row.month+'월'),description);
      list.append(group);
    }
    months.append(list);
    article.append(months);
    return article;
  }

  function drawPurchased(result,host,owner,reading) {
    const {report}=result;
    displayTitle(reading);
    const now={id:result.id,host,owner,reading};active=now;
    const layout=el('div',null,'sr-layout'), contents=el('div',null,'sr-pages');
    const balance=el('p',reading.name+' 상담 '+result.questionsLeft+'회 남음','sr-balance');
    contents.append(balance,introGuide(reading,purchasedContext(reading,report),report.first));
    for(const [index,chapter] of [report.first,...report.body].entries()){
      const page=paper(chapter,index,result.questionsLeft>0?()=>followup(result,chapter,index-1,owner,reading):null,reading);
      if(index===0&&report.calendar?.judgment)page.querySelector('.sr-highlight').after(wealthJudgment(report.calendar.judgment));
      if(index===2&&report.calendar)page.querySelector('.sr-evidence')?.before(calendarArticle(report.calendar));
      contents.append(page);
    }
    layout.append(toc(reading,report.first,false),contents);
    show([header(reading,report.choice,report.day,report.known??report.profile?.hourValue!=='unknown'),layout],true);
  }

  async function renderPurchased(result,host,owner,autoGenerate,reading) {
    if(!accountStore.current(owner))return;
    clearGenerationTimers();
    if(result.state==='ready'){drawPurchased(result,host,owner,reading);return;}
    displayTitle(reading);
    const state={id:result.id,host,owner,reading};active=state;
    const stillCurrent=()=>active===state&&accountStore.current(owner);
    const panel=el('section',null,'sr-generation');
    const content=el('div',null,'sr-generation-copy');
    const heading=el('h2','리포트를 준비하고 있어요');
    const message=el('p','결제를 확인했어요.','sr-status');
    message.setAttribute('role','status');
    const meter=el('div',null,'sr-generation-meter');
    meter.hidden=true;
    const meterLine=el('div',null,'sr-generation-meter-label');
    const meterLabel=el('span','진행률');
    const eta=el('p','예상 소요 시간 약 '+typicalWriteSeconds+'초','sr-generation-eta');
    const number=el('strong','0%');
    number.setAttribute('aria-hidden','true');
    const bar=el('progress');
    bar.max=100;bar.value=0;
    bar.setAttribute('aria-label','리포트 작성 진행률');
    meterLine.append(meterLabel,number);
    meter.append(meterLine,bar,eta);
    const after=el('p','개인 풀이 6장 · 읽기 안내 2장 · '+withName(reading)+' 채팅 상담 3회','sr-generation-next');
    const action=button('전체 리포트 만들기','sr-secondary sr-generation-action',generate);
    action.hidden=autoGenerate||result.state==='generating';
    content.append(heading,message,meter,after,action);
    panel.append(prepareWritingVisual(reading),content);
    show([panel]);
    if(autoGenerate&&result.state==='paid')void generate();
    if(result.state==='generating')watchCompletion(result.startedAtMs);

    function setProgress(percent) {
      if(!stillCurrent())return;
      meter.hidden=false;
      bar.value=percent;
      number.textContent=percent+'%';
    }
    function startProgress(startedAt=Date.now()) {
      clearInterval(progressTimer);
      writingFilm.hidden=false;
      heading.textContent=reading.name+(reading===defaultReading?'가':'이')+' 본편을 쓰고 있어요';
      setStatus(message,'고른 고민을 바탕으로 사주 풀이를 엮고 있어요.');
      eta.textContent='예상 소요 시간 약 '+typicalWriteSeconds+'초';
      const initial=Math.min(Date.now(),Number.isFinite(startedAt)?startedAt:Date.now());
      const update=()=>{
        if(!stillCurrent()){clearInterval(progressTimer);return;}
        const elapsed=Date.now()-initial;
        setProgress(Math.max(0,Math.min(95,Math.floor(elapsed*95/estimatedWriteMs))));
        if(elapsed>estimatedWriteMs)eta.textContent='평소보다 조금 더 오래 걸리고 있어요.';
      };
      update();
      progressTimer=setInterval(update,450);
      return initial;
    }
    function showReady(ready) {
      clearGenerationTimers();
      pauseWritingFilm();
      heading.textContent='리포트가 완성됐어요';
      action.hidden=true;
      meterLabel.textContent='리포트 작성 완료';
      eta.hidden=true;
      bar.setAttribute('aria-label','리포트 작성 완료');
      setProgress(100);
      setStatus(message,'잠시 후 본편이 열려요.');
      setTimeout(()=>{if(stillCurrent())drawPurchased(ready,host,owner,reading);},650);
    }
    function offerRetry(text) {
      clearGenerationTimers();
      pauseWritingFilm();
      meter.hidden=true;
      heading.textContent='리포트를 이어서 준비할 수 있어요';
      setStatus(message,text);
      action.textContent='작성 상태 다시 확인';
      action.hidden=false;
    }
    function watchCompletion(startedAt) {
      const initial=startProgress(startedAt);
      const poll=async()=>{
        if(!stillCurrent())return;
        try{
          const latest=await request(reading,{operation:'open',id:state.id},owner);
          if(!stillCurrent())return;
          if(latest.state==='ready'){showReady(latest);return;}
          if(latest.state!=='generating'||Date.now()-initial>155000){
            offerRetry(latest.state==='paid'?'본편 작성이 아직 끝나지 않았어요. 작성 상태를 다시 확인해 주세요.':'내 기록에서 리포트 상태를 다시 확인해 주세요.');
            return;
          }
        }catch{}
        if(!stillCurrent())return;
        if(Date.now()-initial<=155000)statusTimer=setTimeout(poll,5500);
        else offerRetry('작성 상태를 바로 확인하지 못했어요. 잠시 뒤 다시 확인해 주세요.');
      };
      statusTimer=setTimeout(poll,5500);
    }

    async function generate(){
      if(action.disabled||!stillCurrent())return;
      clearTimeout(statusTimer);
      action.disabled=true;
      action.hidden=true;
      let hiddenForConsent=false;
      let loading=false;
      try{
        const latest=await request(reading,{operation:'open',id:state.id},owner);
        if(!stillCurrent())return;
        if(latest.state==='ready'){showReady(latest);return;}
        if(latest.state==='generating'){watchCompletion(latest.startedAtMs);return;}
        if(latest.state!=='paid')throw Error('현재 열람할 수 없는 리포트예요. 내 기록에서 결제 상태를 확인해 주세요.');
        dialog.close();
        hiddenForConsent=true;
        const agreed=await window.TaekilPrivacy.confirmAI(host);
        if(!stillCurrent()||!host.closest('.view')?.classList.contains('visible')){if(active===state)active=null;return;}
        dialog.showModal();
        hiddenForConsent=false;
        if(!agreed){
          offerRetry('AI 이용에 동의하면 전체 리포트를 만들 수 있어요. 결제한 리포트는 내 기록에서 다시 열 수 있어요.');
          action.textContent='동의하고 작성 시작하기';
          return;
        }
        loading=true;
        startProgress();
        const generated=await request(reading,{operation:'generate',id:state.id},owner,150000);
        if(stillCurrent()){
          if(generated.state==='ready')showReady(generated);
          else if(generated.state==='generating')watchCompletion(generated.startedAtMs);
          else offerRetry('작성 상태를 다시 확인해 주세요.');
        }
      }catch(error){
        if(stillCurrent()){
          if(hiddenForConsent&&host.closest('.view')?.classList.contains('visible'))dialog.showModal();
          offerRetry(loading&&['TimeoutError','AbortError'].includes(error.name)?'작성 상태를 바로 확인하지 못했어요. 잠시 뒤 이 화면이나 내 기록에서 다시 확인해 주세요.':error.message);
        }
      }finally{action.disabled=false;}
    }
  }

  async function followup(result,chapter,index,owner,reading) {
    if(!accountStore.current(owner))return;
    close();
    goTo('home');
    if(by('aiChatPanel').style.display==='flex')by('consultationExit').click();
    fillAiChatDateSelects();
    const {profile}=result.report;
    for(const [id,value] of Object.entries({Year:profile.y,Month:profile.m,Day:profile.d,CalType:profile.calType,
      Hour:profile.hourValue,Gender:profile.gender,ProfileName:'나',Relation:'본인',CompareProfile:'',CompareProfile2:''})){
      by('aiChat'+id).value=value;
    }
    by('aiChatLeap').checked=profile.isLeap;
    await startAiChat({source:'free-report',paidReport:true,consultantId:reading.id});
    if(!accountStore.current(owner)||window.__aiConsultantId!==reading.id||by('aiChatPanel').style.display!=='flex')return;
    window.__seohwaReportSession={owner,id:result.id,chapter:index,conversationId:window.__aiConversationId,reading};
    window.TaekilSeohwaReport.setBalance(result.questionsLeft);
    prepareAiQuestion('리포트의 “'+chapter.highlight+'” 부분을 제 상황에 맞춰 좀 더 풀어주세요.');
  }

  async function reopen(id,owner,status,reading) {
    const visible=()=>accountStore.current(owner)&&by('view-history').classList.contains('visible');
    try{
      const result=await request(reading,{operation:'open',id,allowResume:true},owner);
      if(!visible())return;
      if(result.state==='resume'){client.showResume(status,result,pendingKey(reading));return;}
      if(result.state==='pending'){setStatus(status,client.pendingMessage(result));return;}
      if(!['paid','ready','generating'].includes(result.state)) throw Error('현재 열 수 있는 리포트가 아니에요. 결제 상태를 확인해 주세요.');
      if(accountStore.getItem(pendingKey(reading))===id)accountStore.removeItem(pendingKey(reading));
      setStatus(status,'결제한 리포트를 열었어요.');
      await renderPurchased(result,by('seohwaLibrary'),owner,false,reading);
    }catch(error){if(accountStore.current(owner))setStatus(status,error.message);}
  }
  async function list() {
    const owner=accountStore.snapshot();
    if(!owner.owner){openAuthModal();return;}
    const version=++loadingLibrary, trigger=by('loadSeohwaReports');
    trigger.disabled=true;
    const current=()=>accountStore.current(owner)&&version===loadingLibrary;
    setStatus(libraryStatus,'구매한 리포트를 불러오고 있어요.');
    try{
      const {reports}=await request(null,{operation:'list'},owner);
      if(!current())return;
      const rows=reports.map(record=>{
        const date=new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeZone:'Asia/Seoul'}).format(record.createdAtMs);
        const reading=catalog.forId(record.consultantId);
        return button(reading.name+' · '+reading.stories[record.choice].label+' · '+date,'sr-library-button',()=>reopen(record.id,owner,libraryStatus,reading));
      });
      for(const reading of catalog.all){
        const pending=accountStore.getItem(pendingKey(reading));
        if(pending&&!reports.some(item=>item.id===pending&&item.consultantId===reading.id))rows.unshift(button(reading.title+' 결제 상태 확인','sr-library-button',()=>reopen(pending,owner,libraryStatus,reading)));
      }
      library.replaceChildren(...rows);
      setStatus(libraryStatus,reports.length?'최근 리포트부터 표시해요.':'저장한 리포트가 아직 없어요.');
    }catch(error){if(current())setStatus(libraryStatus,error.message);}
    finally{if(current())trigger.disabled=false;}
  }
  async function checkCheckoutReturn() {
    if(!returnView.classList.contains('visible'))return;
    if(active?.host===returnHost&&accountStore.current(active.owner))return;
    const owner=accountStore.snapshot();
    if(returnAttempt&&accountStore.current(returnAttempt.owner))return;
    returnAuth.hidden=true;
    returnRetry.hidden=true;
    const url=new URL(location.href);
    const reading=readingAtReturn(url);
    by('seohwaReturnName').textContent=reading.title;
    returnLink.href='#topic-'+reading.topic;
    returnLink.textContent=reading.name+' 이야기로 돌아가기';
    if(!owner.owner){
      if(firebaseReady&&!firebaseAuthReady)return;
      setStatus(returnStatus,'결제하신 계정으로 로그인하면 리포트 준비를 이어갈 수 있어요.');
      returnAuth.hidden=false;
      return;
    }
    const orderId=url.searchParams.get(reading===defaultReading?'seohwaOrder':'reportOrder');
    const pending=accountStore.getItem(pendingKey(reading));
    const payload=orderId?{operation:'checkout-status',orderId}:{operation:'open',id:pending,allowResume:true};
    if(!orderId&&!pending){
      setStatus(returnStatus,'이 결제 주소에서 주문을 찾지 못했어요. 이미 구매한 리포트는 내 기록에서 열 수 있어요.');
      return;
    }
    const attempt={owner};
    returnAttempt=attempt;
    const current=()=>returnAttempt===attempt&&accountStore.current(owner)&&returnView.classList.contains('visible');
    const started=Date.now();
    setStatus(returnStatus,'페이앱의 결제 결과를 확인하고 있어요. 확인되면 이 화면에서 리포트가 시작돼요.');
    try{
      while(current()){
        const result=await request(reading,payload,owner);
        if(!current())return;
        if(['paid','generating','ready'].includes(result.state)){
          if(orderId&&accountStore.getItem(pendingKey(reading))===result.id)accountStore.removeItem(pendingKey(reading));
          setStatus(returnStatus,result.state==='ready'?'완성된 리포트를 다시 열 수 있어요.':'결제가 확인됐어요. 리포트 준비를 이어갈 수 있어요.');
          returnRetry.textContent='리포트 다시 열기';
          await renderPurchased(result,returnHost,owner,true,reading);
          return;
        }
        if(['cancelled','refunded','partially_refunded','superseded'].includes(result.state)){
          setStatus(returnStatus,'이 주문으로 열람할 수 있는 리포트가 없어요. 페이앱의 결제 내역을 확인해 주세요.');
          return;
        }
        if(result.state!=='pending'&&result.state!=='resume')throw new Error('결제 상태를 확인하지 못했어요.');
        if(result.waiting==='deposit'){
          setStatus(returnStatus,'가상계좌 입금 확인을 기다리고 있어요. 입금이 확인되면 이 화면에서 리포트가 열려요.');
          break;
        }
        if(Date.now()-started>=30000){
          setStatus(returnStatus,'아직 페이앱 결제 완료 결과를 받지 못했어요. 결제 알림을 받으셨다면 다시 결제하기 전에 상태를 확인해 주세요.');
          break;
        }
        await new Promise(resolve=>setTimeout(resolve,2500));
      }
    }catch(error){
      if(current())setStatus(returnStatus,error.message||'결제 상태를 확인하지 못했어요.');
    }finally{
      if(current())returnRetry.hidden=false;
      if(returnAttempt===attempt)returnAttempt=null;
    }
  }
  // Older PayApp receipts pointed to the archive. Normalize before the router starts.
  const returnUrl=new URL(location.href);
  if((returnUrl.searchParams.get('seohwaReport')==='1'||catalog.forId(returnUrl.searchParams.get('featuredReport')))&&(!returnUrl.hash||returnUrl.hash==='#history')){
    returnUrl.hash='seohwa-report';
    history.replaceState(history.state,'',returnUrl);
  }
  by('loadSeohwaReports').addEventListener('click',()=>list());
  returnRetry.addEventListener('click',()=>{
    returnRetry.textContent='결제 상태 다시 확인';
    void checkCheckoutReturn();
  });
  returnAuth.addEventListener('click',()=>openAuthModal());
  returnLink.addEventListener('click',event=>{
    event.preventDefault();
    goTo(returnLink.hash.slice(1));
  });
  window.addEventListener('DOMContentLoaded',()=>{
    void checkCheckoutReturn();
    if(firebaseReady&&!firebaseAuthReady)void firebaseAuthSettled.then(checkCheckoutReturn);
  },{once:true});
  new MutationObserver(()=>{
    if(returnView.classList.contains('visible'))void checkCheckoutReturn();
    else {
      returnAttempt=null;
      if(active?.host===returnHost)close();
      const url=new URL(location.href);
      if(url.hash!=='#seohwa-report'&&(url.searchParams.get('seohwaReport')==='1'||url.searchParams.has('featuredReport'))){
        url.searchParams.delete('seohwaReport');
        url.searchParams.delete('seohwaOrder');
        url.searchParams.delete('featuredReport');
        url.searchParams.delete('reportOrder');
        history.replaceState(history.state,'',url);
      }
    }
  }).observe(returnView,{attributes:true,attributeFilter:['class']});
  window.addEventListener('taekilso:authChanged',()=>{
    const next=accountStore.owner();
    if(next===accountOwner){void checkCheckoutReturn();return;}
    accountOwner=next;
    returnAttempt=null;
    if(active&&!accountStore.current(active.owner))close();
    window.__seohwaReportSession=null;
    loadingLibrary++; library.replaceChildren(); by('loadSeohwaReports').disabled=false;
    libraryStatus.textContent='구매한 리포트를 여기서 다시 읽을 수 있어요.';
    void checkCheckoutReturn();
  });

  function session() {
    const locked=window.__seohwaReportSession;
    return locked && locked.conversationId===window.__aiConversationId && window.__aiConsultantId===locked.reading.id &&
      accountStore.current(locked.owner) ? locked : null;
  }
  function setBalance(count) {
    const linked=session();
    if(linked)by('aiChatStatus').textContent=linked.reading.name+' 리포트 상담 '+count+'회 남음';
  }
  function showChatAccess(reading,message){
    if(!reading||by('aiChatWindow').querySelector('[data-report-chat-access]'))return;
    const note=appendAiChatMessage('system-note',message||reading.name+'에게는 해당 리포트에 포함된 채팅 상담 3회를 사용할 수 있어요.');
    note.dataset.reportChatAccess='';
    const links=el('div',null,'sr-chat-access');
    links.append(button('리포트 첫 장 보기','sr-secondary',()=>goTo('topic-'+reading.topic)),
      button('구매한 리포트 보기','sr-secondary',()=>goTo('history')));
    note.append(links);
  }
  function recordScope() {
    const linked=session();
    if(!linked)return {};
    return linked.reading===defaultReading?{seohwaReportId:linked.id,seohwaChapter:linked.chapter}:
      {featuredReportId:linked.id,featuredReportChapter:linked.chapter};
  }
  function restoreScope(record,owner) {
    const reading=catalog.forId(record.consultantId);
    const legacy=reading===defaultReading;
    const id=legacy?record.seohwaReportId:record.featuredReportId;
    window.__seohwaReportSession=reading&&/^[a-f0-9]{64}$/.test(id)
      ? {owner,reading,id,chapter:legacy?record.seohwaChapter:record.featuredReportChapter,conversationId:record.id}:null;
  }
  async function showRestoredBalance() {
    const linked=session();
    if(!linked){showChatAccess(catalog.forId(window.__aiConsultantId));return;}
    const status=by('aiChatStatus');
    status.textContent=linked.reading.name+' 리포트 상담 · 남은 횟수 확인 중';
    try{
      const data=await request(linked.reading,{operation:'open',id:linked.id},linked.owner);
      if(session()===linked&&Number.isInteger(data.questionsLeft)&&status.textContent.endsWith('확인 중'))setBalance(data.questionsLeft);
    }catch{
      if(session()===linked&&status.textContent.endsWith('확인 중')){
        status.textContent=linked.reading.name+' 리포트 상담 · 내 기록에서 이용 상태 확인';
        showChatAccess(linked.reading,'내 기록에서 구매한 리포트의 이용 상태를 확인해 주세요.');
      }
    }
  }
  function shouldResume() {
    let resume=waitingLogin;
    waitingLogin=false;
    try{
      resume=resume||sessionStorage.getItem(restoreKey)==='1';
      if(resume)sessionStorage.removeItem(restoreKey);
    }catch{}
    return resume;
  }
  function focusCheckoutAfterLogin() {
    if(!dialog.open||!active?.owner.owner||!accountStore.current(active.owner))return;
    if(active.previewPending)finishPreview(active);
    const status=body.querySelector('.sr-gate .sr-status');
    const pay=body.querySelector('.sr-gate button[data-checkout-action]');
    if(!status||!pay?.getClientRects().length)return;
    setStatus(status,'로그인됐어요. 결제창을 열어 이어서 진행해 주세요.');
    pay.focus({preventScroll:true});
    pay.scrollIntoView({block:'center',behavior:'instant'});
  }
  window.TaekilSeohwaReport={openPreview,session,setBalance,recordScope,restoreScope,showChatAccess,showRestoredBalance,shouldResume,focusCheckoutAfterLogin};
})();
