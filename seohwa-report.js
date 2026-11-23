(() => {
  'use strict';
  const catalog=window.TaekilFeaturedReports, client=window.TaekilAccountReport, checkout=window.TaekilCheckout;
  const defaultReading=catalog.forId('seohwa');
  const topicContent=window.TaekilReportTopics;
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
    const page=el('article',null,'sr-paper report-sheet');
    page.id='seohwa-report-chapter-'+index;
    const h=el('h3',chapter.title);
    h.tabIndex=-1;
    const folio=reading?String(index+1).padStart(2,'0')+' / 06':'제'+(index+1)+'장';
    page.append(el('p',folio,'sr-page-label report-folio'),h,el('p',chapter.highlight,'sr-highlight'));
    if(chapter.sections)for(const section of chapter.sections){
      page.append(el('h4',section.title));
      for(const text of section.text.split('\n'))page.append(el(section.quote?'blockquote':'p',text));
    }
    else for(const paragraph of chapter.paragraphs){
      const sentences=reading?paragraph.match(/[^.!?]+(?:[.!?]+|$)/g):null;
      if(sentences?.length>4){
        for(let i=0;i<sentences.length;i+=3)page.append(el('p',sentences.slice(i,i+3).join('').trim()));
      }else page.append(el('p',paragraph));
    }
    const basis=Array.isArray(chapter.basis)?chapter.basis[0]:chapter.basis;
    if(basis){
      const details=el('details',null,'sr-evidence');
      details.append(el('summary',reading?.id==='dogyeom'?'이 해석의 사주 근거 보기':'이 장에 사용한 사주 근거'),el('p',basis.natal+' 기둥 · '+basis.location+' · '+basis.term),
        el('p',basis.meaning));
      page.append(details);
    }
    if(followup) page.append(button(reading.id==='dogyeom'?'이 해석을 도겸에게 물어보기':'이 대목으로 '+reading.name+'에게 묻기','sr-ask',followup));
    return page;
  }

  function header(reading,choice,day,known,paidYear,profile) {
    const head=el('header',null,'sr-cover');
    const image=el('img');
    image.src='/'+window.TaekilConsultationPersonas.get(reading.id).portrait; image.alt='';
    image.width=640; image.height=800;
    head.append(image);
    const title=el('div',null,'sr-cover-text');
    const heading=el('h2',paidYear?(topicPresentation[reading.id]?.title||paidYear+'년 나의 재물운'):reading.title);
    heading.tabIndex=-1;
    const metadata=[reading.stories[choice].label,day&&day+' 일주',known===false&&'출생시간 미상'].filter(Boolean);
    if(paidYear)metadata.shift();
    title.append(el('p',paidYear?reading.title:'무료 첫 장','sr-kicker'),heading,
      el('p',metadata.join(' · ')));
    const birth=window.TaekilReportGuide.birthDate(profile);
    if(birth)title.append(birth);
    const navigation=el('div',null,'sr-cover-nav');
    navigation.append(button(paidYear?(reading.id==='dogyeom'?'올해 총평 읽기':'본편 바로 읽기'):'내 풀이 바로 보기','sr-personal-jump',()=>jumpToChapter(paidYear?1:0)));
    if(paidYear)navigation.append(button('목차 보기','sr-cover-toc',()=>{
      const list=by('wealthReportToc');
      list.querySelector('button').focus({preventScroll:true});
      list.scrollIntoView({block:'start',behavior:'instant'});
    }));
    title.append(navigation);
    head.append(title);
    return head;
  }
  function jumpToChapter(index){
    const heading=by('seohwa-report-chapter-'+index)?.querySelector('h3');
    const parent=heading?.closest('details');
    if(parent)parent.open=true;
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
    if(!locked)list.id='wealthReportToc';
    list.append(el('h3','리포트 목차'));
    const rows=el('ol');
    for(const [index,title] of [first.title,...reading.chapters].entries()){
      const row=el('li');
      if(locked&&index>0){
        const chapter=el('div');
        const wealthGuide=['2026년과 비교해 재물의 흐름이 달라지는 이유','열두 달의 기회·주의 지표와 원국의 관계','기회가 강한 세 시기와 절기 구간','신중하게 볼 세 시기와 그 이유','앞으로 10년의 흐름과 대운·세운 근거'];
        chapter.append(el('strong',title),el('small',reading.id==='dogyeom'?wealthGuide[index-1]:(topicContent?.topics[reading.id]?.guide||reading.guide)[index-1]));
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
    progress.value=dialog.scrollTop/Math.max(1,dialog.scrollHeight-dialog.clientHeight);
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
      ...(reading.id==='dogyeom'?[['월별 재물운과 10년 흐름','2027년 기회와 지출 주의 TOP 3, 열두 달 달력과 향후 10년 흐름을 읽어요.']]:[]),
      ['개인 사주 풀이 6장',reading.id==='dogyeom'?'열어본 리포트는 내 기록에서 다시 읽을 수 있어요.':'무료 첫 장과 함께 사주표 읽기 안내 2장까지 내 기록에서 다시 읽을 수 있어요.'],
      [withName(reading)+' 채팅 상담 3회','리포트 구매 후, 마음에 남은 대목에서 바로 이어서 물어볼 수 있어요.']
    ]){
      const benefit=el('li');
      benefit.append(el('strong',title),el('span',description));
      benefits.append(benefit);
    }
    gate.append(el('h3','전체 리포트와 '+reading.name+' 상담'),benefits,paymentNote,pay,status,paused,checkout.statusNote());
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
    const cover=header(reading,choice,context.day,context.known);
    const chapter=paper(first,0,null,reading);
    const guide=el('details',null,'sr-evidence sr-wealth-origin');
    guide.append(el('summary','내 사주 원국과 핵심 근거 보기'),introGuide(reading,context,first));
    chapter.append(guide);
    const tocTopic=topicContent?.topics[reading.id];
    contents.append(chapter,toc(tocTopic?{...reading,chapters:tocTopic.chapters}:reading,first,true),...(excerpts.length?[samples]:[]),gate);
    const quick=el('div',null,'sr-wealth-quick');
    const jump=button('전체 리포트 · '+won.format(reading.PRICE)+'원','sr-primary',()=>{
      pay.focus({preventScroll:true});
      pay.scrollIntoView({block:'center'});
    });
    jump.dataset.checkoutAction='';
    quick.append(jump);
    layout.classList.add('sr-wealth-preview');
    layout.append(contents);
    show([cover,layout,quick]);
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
    const isTopic=topicContent?.topics[reading.id];
    const data={reading,profile,choice,auth,context,first:isTopic?topicContent.first(reading,context,choice):reading.first(context,choice),excerpts:isTopic?[]:reading.excerpts(context,choice),host:by('aiChatSetup'),owner:accountStore.snapshot()};
    active=data;
    window.TaekilCampaign?.activity('preview_'+reading.topic);
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
    if(data.focusCheckout)focusCheckoutAfterLogin();
    else body.querySelector('.sr-cover h2').focus({preventScroll:true});
  }
  function preparePreview(data){
    clearGenerationTimers();
    data.previewPending=true;
    displayTitle(data.reading);
    const panel=el('section',null,'sr-generation sr-preview-generation');
    const copy=el('div',null,'sr-generation-copy');
    const title=el('h2','무료 첫 장을 준비하고 있어요');
    title.tabIndex=-1;
    const bar=el('progress');
    bar.max=previewWaitMs;
    bar.value=0;
    bar.className='sr-preview-progress';
    bar.setAttribute('aria-label','무료 미리보기 준비 진행률');
    copy.append(title,el('p','입력한 출생 정보에 맞춰 사주표와 첫 풀이를 준비해요.','sr-status'),bar,
      el('p','약 10초 · 내 사주표와 첫 풀이','sr-generation-next'));
    panel.append(prepareWritingVisual(data.reading),copy);
    show([panel]);
    title.focus({preventScroll:true});
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
    if(!checkout.requireOpen())return;
    window.TaekilCampaign?.activity('buy_'+reading.topic);
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
        const order=await request(reading,{operation:'prepare',comparison:{profile:data.profile,choice:data.choice},checkout:true,allowResume:true,expectedPrice:reading.PRICE},owner);
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
        const opened=client.pay(order,{price:reading.PRICE,name:reading.NAME,payAppName:reading.paymentName,metricTopic:reading.topic,
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

  function wealthRanking(calendar){
    const section=el('section',null,'sr-wealth-ranking');
    const byMonth=new Map(calendar.rows.map(row=>[row.month,row]));
    const {opportunity,expense}=calendar.ranking;
    const opportunities=new Set(opportunity),expenses=new Set(expense);
    const highlight=opportunity[0]||1;
    const title=el('h3',calendar.year+'년 월별 재물운');
    title.id='wealthCalendarHeading';
    title.tabIndex=-1;
    const method=el('details',null,'sr-evidence');
    method.append(el('summary','월별 점수를 읽는 법'),
      el('p','기회 점수는 사주에 나타난 수입·보상과 돈을 남기는 흐름을 더하고, 지출 점검 신호를 덜어 계산해요. 지출 점검 점수는 따로 매겨요. 두 점수 모두 이 사람의 열두 달을 비교하는 명리 해석 지표예요. 실제로 돈이 들어올 확률이나 투자 수익률과는 달라요.'),
      el('p','수입 신호에는 월간 재성 +7, 지지 주기운의 재성 +4, 식상과 재성의 동반 +5를 반영해요. 원국 재성과 월간 식상이 연결되거나 원국의 주된 재물 성향과 같은 월간 재성이 오면 각각 +3, 원국 월지·일지와 충이 있으면 −2예요. 보유 신호는 월간·지지 정재 +8·+4, 월간 식신·정관 +3·+2, 충 또는 월간 비겁 −3이에요. 주의 신호는 월간 겁재·비견·편관 +6·+4·+3, 지지 비겁 +3, 충 +4, 재성과 비겁의 동반 +3이에요.'),
      el('p','같은 점수는 같은 순위로 표시하고, 상위 세 달을 뽑을 때 점수가 같으면 앞선 달부터 보여드려요.'));
    const chart=el('div',null,'sr-wealth-chart');
    chart.setAttribute('role','group');
    chart.setAttribute('aria-label','월별 재물 기회와 지출 주의 지표');
    const buttons=calendar.rows.map(row=>{
      const bar=el('button',null,'sr-wealth-bar');
      bar.type='button';
      bar.dataset.month=row.month;
      bar.dataset.signal=opportunities.has(row.month)&&expenses.has(row.month)?'both':
        opportunities.has(row.month)?'opportunity':expenses.has(row.month)?'expense':'normal';
      bar.setAttribute('aria-label',row.month+'월, 기회 '+row.score+'점, 지출 주의 '+row.expenseScore+'점');
      bar.setAttribute('aria-controls','wealthMonthDetail');
      const track=el('span',null,'sr-wealth-track'), fill=el('span',null,'sr-wealth-fill');
      fill.style.height=row.score+'%';
      track.setAttribute('aria-hidden','true');
      bar.append(track,el('span',row.month+'월'));
      const caution=el('span',null,'sr-wealth-risk-fill');
      caution.style.height=row.expenseScore+'%';
      track.append(fill,caution);
      chart.append(bar);
      bar.addEventListener('click',()=>selectMonth(row.month));
      return bar;
    });
    const leaders=el('div',null,'sr-wealth-leaders');
    for(const [label,months,scores] of [['재물 기회',opportunity,'score'],['지출 점검',expense,'expenseScore']]){
      if(!months.length)continue;
      const card=el('section',null,'sr-wealth-leader');
      card.dataset.signal=scores==='score'?'opportunity':'expense';
      const list=el('ol');
      for(const month of months){
        const row=byMonth.get(month), entry=el('li');
        const button=el('button',row.month+'월 · '+row[scores]+'점');
        button.type='button';
        button.addEventListener('click',()=>selectMonth(month));
        entry.append(button);
        list.append(entry);
      }
      card.append(el('h6',label+' TOP '+months.length),list);
      leaders.append(card);
    }
    const monthLabel=el('label','월 선택','sr-wealth-role sr-wealth-month-select');
    const monthSelect=el('select');
    for(const row of calendar.rows){
      const option=el('option',row.month+'월');
      option.value=row.month;
      monthSelect.append(option);
    }
    monthLabel.append(monthSelect);
    monthSelect.addEventListener('change',()=>selectMonth(Number(monthSelect.value)));
    const detail=el('div',null,'sr-wealth-month-detail');
    detail.id='wealthMonthDetail';
    detail.setAttribute('aria-live','polite');
    const roleLabel=el('label','상황에 맞춰 보기','sr-wealth-role');
    const role=el('select');
    for(const [value,label] of [['employee','직장·월급'],['business','사업·부업'],['investor','투자자금 관리']]){
      const option=el('option',label);
      option.value=value;
      role.append(option);
    }
    roleLabel.append(role);
    const neutral=el('option','선택해 주세요');neutral.value='';role.prepend(neutral);role.value='';
    const action=el('p',null,'sr-wealth-role-action');
    let selected;
    function selectMonth(month){
      selected=byMonth.get(month);
      monthSelect.value=String(month);
      buttons.forEach(bar=>bar.setAttribute('aria-pressed',String(Number(bar.dataset.month)===month)));
      const basis=el('details',null,'sr-evidence');
      basis.append(el('summary','이 달을 읽은 사주 근거'),
        el('p',selected.ganZhi+' 월운 · '+selected.basis),
        el('p',selected.segments?'한국시간 · 각 구간은 종료 시각 직전까지예요.':selected.from+'부터 '+selected.untilExclusive+' 직전까지 (한국시간)'));
      if(selected.relations?.length)basis.append(el('p','원국과의 관계 · '+selected.relations.join(' / ')));
      if(selected.segments?.some(s=>s.groups))basis.append(el('p','월 점수는 가장 긴 절기 구간의 원국·월운 비교값이에요. 대운과 세운의 작용은 별도 풀이에 반영해요. 동점은 같은 순위이며 세 달을 고를 때는 앞선 달부터 표시해요.'));
      for(const segment of selected.segments||[])basis.append(el('p',segment.from+' ~ '+segment.untilExclusive+' · '+segment.yearGanZhi+' 세운 · '+segment.monthGanZhi+' 월운'+(segment.groups?' · 기회 '+segment.score+' / 주의 '+segment.expenseScore+' · '+segment.basis+(segment.groups.length?' · '+segment.groups.join(' / '):''):'')));
      if(selected.components){
        const {income,retention,risk}=selected.components;
        basis.append(el('p','택일소가 달을 비교하기 위해 정한 해석 지표예요. 수익 확률이나 검증된 명리 점수가 아니에요. 기회 = 49 + 2 × 수입 신호('+income+') + 보유 신호('+retention+') − 주의 신호('+risk+'). 지출 점검 = 18 + 6 × 주의 신호. 각 지표는 0~100 범위로 표시해요.'));
        basis.append(el('p',selected.natalLink.length?'월간의 십성이 원국의 '+selected.natalLink.join('·')+'에도 있어 익숙한 성향이 드러나는 달로 읽어요.':'확인된 원국에서 이 달의 월간과 같은 십성은 보이지 않아, 평소와 다른 흐름으로 읽어요.'));
      }
      detail.replaceChildren(el('h6',month+'월 재물운 · 기회 '+selected.rank+'위'),
        el('p','기회 '+selected.score+'점 · 지출 점검 '+selected.expenseScore+'점','sr-wealth-detail-score'),
        el('p',selected.ganZhi+' 월운 · '+selected.basis,'sr-wealth-month-basis'),
        ...(selected.relations?.length?[el('p',selected.relations.join(' / '),'sr-wealth-month-relations')]:[]),
        el('p',selected.description),...(selected.comparison?[el('p',selected.comparison)]:[]),el('p',selected.caution),el('p',selected.action),basis);
      action.textContent=selected.roles[role.value]||'';
    }
    role.addEventListener('change',()=>{action.textContent=selected.roles[role.value]||'';});
    selectMonth(highlight);
    const shareStatus=el('span',null,'sr-wealth-share-status');
    shareStatus.setAttribute('role','status');
    const share=button('한 줄 요약 복사','sr-wealth-share',async()=>{
      const text='도겸이 읽은 '+calendar.year+'년 재물운 · '+selected.month+'월, '+selected.label;
      try{
        await navigator.clipboard.writeText(text);
        shareStatus.textContent='요약을 복사했어요.';
      }catch{
        shareStatus.textContent='복사하지 못했어요. '+text;
      }
    });
    const legend=el('div',null,'sr-wealth-legend');
    legend.append(el('span','재물 기회','sr-legend-opportunity'),el('span','지출 주의','sr-legend-expense'));
    const extra=el('details',null,'sr-evidence sr-wealth-tools');
    extra.append(el('summary','상황별 참고와 점수 계산 기준'),roleLabel,action,method);
    section.append(title,legend,chart,leaders,monthLabel,detail,extra);
    if(navigator.clipboard?.writeText)section.append(share,shareStatus);
    return section;
  }

  function wealthTimeline(calendar,kind){
    const opportunity=kind==='opportunity';
    const title=opportunity?'재물 기회가 열리는 세 구간':'신중하게 볼 세 구간';
    const panel=el('section',null,'sr-wealth-timeline sr-wealth-judgment');
    const list=el('ol');
    const segments=calendar.rows.flatMap(row=>row.segments||[]);
    panel.append(el('h4',title),el('p','순위는 양력 달 기준이에요. 아래 기간은 각 달의 대표 월운이 이어지는 구간이에요.'));
    for(const [index,month] of calendar.ranking[kind].entries()){
      const row=calendar.rows.find(item=>item.month===month);
      if(!row)continue;
      const own=row.segments?.find(segment=>segment.monthGanZhi===row.ganZhi);
      const start=own&&segments.find(segment=>segment.monthGanZhi===row.ganZhi);
      const end=own&&segments.findLast(segment=>segment.monthGanZhi===row.ganZhi);
      const item=el('li',null,'sr-wealth-timing');
      item.dataset.kind=kind;
      item.append(el('p',String(index+1)+'위 · 양력 '+month+'월','sr-period-rank'));
      if(start&&end){
        const readable=stamp=>Number(stamp.slice(5,7))+'월 '+Number(stamp.slice(8,10))+'일';
        const boundary=(stamp,first)=>stamp===segments[first?0:segments.length-1][first?'from':'untilExclusive'];
        const clippedStart=boundary(start.from,true),clippedEnd=boundary(end.untilExclusive,false);
        const endLabel=clippedEnd?'연말까지':readable(end.untilExclusive)+' 절입 전';
        item.append(el('h5',(clippedStart?'연초':readable(start.from))+'부터 '+endLabel));
        const times=el('details',null,'sr-evidence');
        times.append(el('summary','정확한 구간 보기'),el('p',start.from+'부터 '+end.untilExclusive+' 직전까지'));
        if(clippedStart||clippedEnd)times.append(el('p','리포트가 다루는 '+calendar.year+'년 안의 구간을 표시했어요.'));
        item.append(times);
      }else item.append(el('h5',month+'월 · '+row.ganZhi+' 월운'));
      const firstDetails=item.querySelector('details');
      const explanation=[el('p',row.ganZhi+' 월운 · '+row.basis,'sr-wealth-month-basis'),
        el('p',opportunity?row.description:row.caution)];
      if(firstDetails)firstDetails.before(...explanation);
      else item.append(...explanation);
      list.append(item);
    }
    panel.append(list);
    return panel;
  }

  function wealthOutlook(outlook,calendar){
    const section=el('section',null,'sr-wealth-outlook');
    const details=el('details',null,'sr-evidence');
    if(calendar.version>=6){
      section.append(el('h4',calendar.daewoon?'대운 · 여러 해에 걸친 배경':'10년 세운 전망'));
      if(!calendar.daewoon)section.append(el('p','확정할 수 있는 대운 구간이 없어 해마다 달라지는 세운만 읽었어요.'));
      if(calendar.cycleRule?.direction)section.append(el('p',calendar.cycleRule.yearStem+' 연간('+calendar.cycleRule.polarity+')과 입력 성별 기준 '+calendar.cycleRule.direction+'이에요.'));
      if(calendar.daewoon?.age){
        const {years,months,days,hours}=calendar.daewoon.age;
        section.append(el('p','절입 간격을 환산한 첫 대운은 출생 후 '+years+'년 '+months+'개월 '+days+'일 '+hours+'시간, '+calendar.daewoon.start+'부터예요. 입력 시각과 택일소 기산법 기준이에요.'));
      }
      const cycleDetails=el('details',null,'sr-evidence');
      cycleDetails.append(el('summary','대운 기산과 전체 구간'));
      for(const c of calendar.daewoon?.cycles||[])cycleDetails.append(el('h5',(c.from?c.from.slice(0,16)+'부터 '+c.until.slice(0,16)+' 직전까지':c.startYear+'~'+c.endYear+'년')+' · '+c.ganZhi+' 대운'),el('p',c.basis),el('small',c.relations.join(' / ')||'원국과 직접 맞물리는 두 글자 관계가 없어요.'));
      if(calendar.daewoon?.cycles.length)section.append(cycleDetails);
    }
    const years=el('div',null,'sr-year-picker');
    years.setAttribute('role','group');
    years.setAttribute('aria-label','재물운 연도 선택');
    const selectedYear=el('div',null,'sr-year-selected');
    selectedYear.id='wealthYearDetail';
    selectedYear.setAttribute('aria-live','polite');
    const long=outlook.horizons.at(-1);
    const chooseYear=(year,selected)=>{
      for(const btn of years.querySelectorAll('button'))btn.setAttribute('aria-pressed',String(btn===selected));
      selectedYear.replaceChildren(renderYear(year));
    };
    details.append(el('summary','연도별 세운과 원국 근거 살펴보기'));
    function renderYear(year){
      const item=el('section',null,'sr-wealth-year');
      item.append(el('h6',year.year+'년 · '+year.label),el('p',year.talk),el('p',year.caution),
        el('small',year.ganZhi+' 세운 · '+year.basis));
      if(year.relations?.length)item.append(el('p',year.relations.join(' / ')));
      if(year.cycles?.length>1)for(const c of year.cycles)item.append(el('p',c.from.slice(0,16)+'부터 '+c.ganZhi+' 대운 · '+(c.relations.join(' / ')||'직접적인 두 글자 관계 없음')));
      if(year.cycle)item.append(el('small',year.cycle.ganZhi+' 대운과 함께 읽어요. '+year.cycle.relations.join(' / ')));
      if(year.cycles?.some(c=>c.groups?.length))for(const c of year.cycles){
        if(c.groups?.length)item.append(el('small',c.ganZhi+' 대운과 함께 모이는 글자 · '+c.groups.join(' / ')));
      }
      return item;
    }
    for(const year of outlook.years){
      const signals=[];
      if(year.year===long?.opportunity)signals.push('기회');
      if(year.year===long?.expense)signals.push('주의');
      if(calendar.daewoon?.cycles?.some(c=>c.from?.startsWith(String(year.year)+'-')))signals.push('대운 전환');
      const btn=button(String(year.year),'sr-year-choice',()=>chooseYear(year,btn));
      btn.setAttribute('aria-controls',selectedYear.id);
      if(signals.length)btn.append(el('small',signals.join(' · ')));
      years.append(btn);
      details.append(renderYear(year));
    }
    if(outlook.years.length)chooseYear(outlook.years[0],years.firstElementChild);
    const horizons=el('dl',null,'sr-wealth-horizons');
    for(const row of outlook.horizons){
      const pair=el('div');
      pair.append(el('dt',outlook.years[0].year+'~'+outlook.years[row.size-1].year+'년'),el('dd','기회 '+row.opportunity+'년 · '+outlook.years.find(y=>y.year===row.opportunity).basis+' / 지출 점검 '+row.expense+'년 · '+outlook.years.find(y=>y.year===row.expense).basis));
      const prev=outlook.horizons[outlook.horizons.indexOf(row)-1];
      if(prev?.opportunity===row.opportunity)pair.append(el('dd','새로 포함된 '+(outlook.years[0].year+prev.size)+'~'+outlook.years[row.size-1].year+'년에도 이 해의 기회 지표를 넘는 해가 없어요. 동점이면 앞선 해를 표시해요.'));
      horizons.append(pair);
    }
    section.append(el('h4','앞으로 10년, 돈이 움직이는 시기'),
      el('p','해마다 바뀌는 세운을 내 사주와 맞춰 본 흐름이에요. 같은 해에 기회와 지출 점검 신호가 함께 올 수도 있어요.'),
      years,selectedYear,horizons,details);
    return section;
  }

  function calendarArticle(calendar) {
    const article=el('section',null,'sr-wealth-calendar');
    article.append(el('h4',calendar.year+'년 재물 달력'),el('p','달마다 가장 긴 절기 구간을 기준으로, 돈을 벌고 지키는 데 살펴볼 점을 정리했어요.'));
    const spring=calendar.rows[1]?.segments?.find(segment=>segment.yearGanZhi==='丁未');
    if(spring)article.append(el('p','1월 1일부터 입춘 전까지는 병오년, '+spring.from+'부터는 정미년으로 계산해요. 한 양력 달 안에서도 월운이 바뀌며 월별 지표는 가장 긴 구간을 대표해요.'));
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
    months.open=!calendar.ranking;
    months.append(el('summary','열두 달 장부 한눈에 보기'));
    const list=el('dl',null,'sr-wealth-months');
    for(const row of calendar.rows){
      const group=el('div'), description=el('dd');
      const score=Number.isInteger(row.score)?' · 기회 '+row.score+'점 · 지출 점검 '+row.expenseScore+'점':'';
      description.append(el('strong',row.label),el('p',row.action),el('small',row.ganZhi+' · '+row.term+score+(row.clash?' · 변화가 잦을 때 조건 재확인':'')));
      group.append(el('dt',row.month+'월'),description);
      list.append(group);
    }
    months.append(list);
    article.append(months);
    return article;
  }

  const topicPresentation={
    seohwa:{title:'2027년 나의 연애운',map:'내 관계를 읽는 세 가지 단서',recap:'인연을 볼 때 기억할 세 가지',
      steps:[['서운함의 뿌리',0],['편안해지는 조건',1],['마음을 전할 때',3]]},
    ijun:{title:'다시 이어갈 관계를 읽는 법',map:'재회를 고민할 때 살펴볼 순서',recap:'다시 연락하기 전에 읽을 세 가지',
      steps:[['내 마음 읽기',0],['지난 관계 살피기',1],['다음 선택 정하기',4]]},
    mujin:{title:'나에게 맞는 일과 환경',map:'내 일에 맞는 조건 세 가지',recap:'다음 자리를 고를 때 기억할 세 가지',
      steps:[['일할 때의 강점',0],['실력을 보이기 좋은 팀',1],['책임과 권한',2]]}
  };
  const newSteps={
    seohwa:[['올해 인연의 변화',0],['내게 어울리는 인연',2],['관계 발전과 주의 시기',3]],
    ijun:[['올해 인연의 변화',0],['지난 인연과 새 인연',2],['선택을 돌아볼 시기',3]],
    mujin:[['올해 직업운의 변화',0],['강점이 드러나는 일터',2],['역할이 바뀌는 흐름',3]]
  };
  function reportOverview(report,reading,periods){
    const theme=topicPresentation[reading.id];
    const overview=el('section',null,'sr-summary sr-topic-summary');
    overview.append(el('h3',theme.map));
    const list=el('ol',null,'sr-topic-map');
    for(const [label,index] of report.topicVersion>=2?newSteps[reading.id]:theme.steps){
      const chapter=report.body[index];
      if(!chapter)continue;
      const row=el('li');
      row.append(button(label,'sr-topic-jump',()=>jumpToChapter(index+1)),el('p',chapter.highlight));
      list.append(row);
    }
    if(periods){
      const moments=el('dl',null,'sr-summary-moments');
      overview.append(el('p',report.body[0].highlight,'sr-summary-lead'));
      for(const {label,rows} of periods.highlights){
        const box=el('div');
        const months=el('dd',null,'sr-ranked-months');
        box.append(el('dt',label+' · TOP 3'),months);
        for(const [index,row] of rows.entries()){
          const go=button(row.month+'월','sr-ranked-month',()=>{
            const bar=overview.parentElement?.querySelector('[data-period-month="'+row.month+'"]');
            if(bar){bar.click();bar.focus({preventScroll:true});bar.scrollIntoView({block:'center',behavior:'instant'});}
          });
          go.setAttribute('aria-label',label+' '+(index+1)+'번째 · '+row.month+'월 풀이');
          months.append(go);
        }
        if(!rows.length)months.textContent='두드러진 달이 없어요';
        moments.append(box);
      }
      overview.append(moments);
    }
    overview.append(list);
    return overview;
  }
  function relationshipEvidence(row){
    const group=el('div');
    group.append(el('p',row.pair+' · 천간 '+row.top+' · 지지 주기운 '+row.hidden,'sr-wealth-month-basis'),el('p',row.reading+'으로 읽어요.'));
    if(row.links.length||row.groups.length)group.append(el('p',[...row.links,...row.groups].join(' / ')));
    else group.append(el('p','이 구간에는 확인된 원국과 직접 맞물리는 합·충 관계가 없어요.'));
    return group;
  }
  function relationshipReading(row,reading){
    const article=el('div',null,'sr-topic-reading');
    const labels={
      seohwa:['새 인연과 관계 발전','관계에서 달라지는 점'],
      ijun:['지난 인연과 다음 인연','관계를 다시 돌아볼 점'],
      mujin:['취업·이직·승진의 흐름','역할과 환경에서 살필 점']
    }[reading.id];
    article.append(el('p',row.insight.signal,'sr-topic-reading-lead'),el('p',row.insight.basis));
    const list=el('dl');
    for(const [index,key] of ['opportunity','caution'].entries()){
      const group=el('div');
      group.append(el('dt',labels[index]),el('dd',row.insight[key]));
      list.append(group);
    }
    article.append(list);
    return article;
  }
  function relationshipMonths(periods,reading,pillars){
    const career=reading.id==='mujin';
    const readingsByMonth=window.TaekilTopicMonthly?.create(periods.calendar,pillars,reading.id);
    const section=el('section',null,'sr-wealth-ranking sr-topic-calendar');
    const graph=el('div',null,'sr-wealth-chart');
    graph.setAttribute('role','group');
    graph.setAttribute('aria-label',career?'월별 직업운과 역할 변화':'월별 인연과 관계 변화');
    const legend=el('div',null,'sr-wealth-legend');
    legend.append(el('span',periods.highlights[0].label,'sr-legend-opportunity'),el('span',career?'이직·역할 변화':'관계 변화','sr-legend-expense'));
    const detail=el('div',null,'sr-wealth-month-detail');
    detail.id='relationshipMonthDetail';
    detail.setAttribute('aria-live','polite');
    const lens=el('label','관계 상황에 맞춰 보기','sr-wealth-role');
    const picker=el('select');
    const readings=[
      ['선택 안 함','합은 이어지는 접점을, 충·형·파·해는 속도나 기대가 달라지는 지점을 살펴보는 단서예요.'],
      ['새 인연을 찾는 중','인연의 접점이 눈에 띄는 구간에서는 내가 어떤 대화에 흥미를 느끼는지 살펴보세요.'],
      ['관심 있는 사람이 있어요','표현의 흐름이 보이는 구간에는 상대가 부담 없이 답할 수 있는 대화부터 생각해 보세요.'],
      ['연애 중이에요','관계 변화가 눈에 띄는 구간에는 가까워지는 속도에 서로 다른 기대가 있는지 살펴보세요.'],
      ['기혼·장기 관계예요','약속과 기준이 눈에 띄는 구간에는 반복해서 맞춰 온 두 사람의 생활 리듬을 돌아보세요.'],
      ['이별 후예요','관계 변화가 눈에 띄는 구간에는 지난 관계에서 유지하고 싶은 것과 달라졌으면 하는 점을 가려보세요.']
    ];
    for(const [index,[label]] of readings.entries()){
      const option=el('option',label);option.value=String(index);picker.append(option);
    }
    lens.append(picker);
    const perspective=el('p',null,'sr-topic-perspective');
    function showPerspective(){
      const selected=Number(picker.value);
      perspective.hidden=selected===0;
      perspective.textContent=readings[selected][1];
    }
    picker.addEventListener('change',showPerspective);
    const scale=Math.max(1,...periods.calendar.flatMap(row=>[row.assessment.axes.open.score,row.assessment.axes.change.score]));
    const choose=(row,selected)=>{
      const activeCard=readingsByMonth?.[row.month-1];
      showPerspective();
      for(const bar of graph.children)bar.setAttribute('aria-pressed',String(bar===selected));
      const exact=el('details',null,'sr-evidence');
      exact.append(el('summary','이 해석의 사주 근거 보기'));
      exact.append(el('p',row.pair+' 월운 · 월간 '+row.top+' · 월지의 중심 십성 '+row.hidden));
      if(activeCard){
        const used=el('ul',null,'sr-topic-used');
        used.append(el('li','핵심 · '+activeCard.evidence.main));
        for(const group of activeCard.evidence.supporting)used.append(el('li','보조 · '+group.join(' / ')));
        if(activeCard.evidence.other.length)used.append(el('li','추가 단서 · '+activeCard.evidence.other.join(' / ')));
        exact.append(used);
      }
      exact.append(el('p','대표 월운 '+row.solarFrom+'부터 '+row.solarUntil+' 직전까지'));
      exact.append(el('p','적용한 세운 · '+row.annual));
      for(const cycle of row.cycles)exact.append(el('p',cycle.pair+' 대운 · '+cycle.from+'부터 '+cycle.until+' 직전까지'));
      for(const cycle of row.cycles){
        const basis=[...cycle.natalLinks,...cycle.annualLinks];
        if(basis.length)exact.append(el('p',cycle.pair+' 대운의 배경 · '+basis.join(' / ')));
      }
      if(!row.cycles.length)exact.append(el('p','대운 전환 시점을 확인할 수 없어 원국과 세운·월운으로 읽었어요.'));
      for(const {key,label,rows} of periods.highlights){
        const index=rows.indexOf(row);
        if(index!==-1)exact.append(el('p',label+' '+(index+1)+'번째 · '+row.assessment.axes[key].fact));
      }
      for(const span of row.spans)exact.append(el('p',span.from+'부터 '+span.until+' 직전까지 · '+span.annual+' 세운 · '+span.pair+' 월운'));
      exact.append(el('p','택일소는 자평 명리의 일간·월령을 바탕으로 일지에 닿는 운과 월주의 여건을 살펴요. 시주는 보조로 보고, 형·파·해는 택일소 계산 기준의 참고 단서로 표시해요. 합만으로 오행이 바뀌었다고 풀이하지 않아요.'));
      const cardReading=activeCard?el('div',null,'sr-topic-reading'):relationshipEvidence(row);
      if(activeCard){
        cardReading.append(el('h5',activeCard.title,'sr-topic-reading-lead'),el('p',activeCard.reading,'sr-topic-answer'));
        const list=el('dl');
        for(const [title,copy] of [['왜 이 달이 중요한가요?',activeCard.lead],['다른 달과의 차이',activeCard.contrast]]){
          if(!copy)continue;
          const group=el('div');
          group.append(el('dt',title),el('dd',copy));
          list.append(group);
        }
        cardReading.append(list);
      }
      detail.replaceChildren(el('h4',row.from.slice(0,4)+'년 '+row.month+'월'),cardReading);
      const tags=periods.highlights.filter(h=>h.rows.includes(row)).map(h=>h.label+' '+(h.rows.indexOf(row)+1)+'위');
      if(tags.length)cardReading.prepend(el('p',tags.join(' · '),'sr-wealth-month-basis'));
      const dates=window.TaekilTopicMonthly?.periodLabels(row);
      if(dates){
        const periods=el('dl',null,'sr-topic-periods');
        for(const [title,copy] of [['대표 절기 월운 · '+row.pair,dates.solar],[row.month+'월에 해당하는 기간',dates.calendar]]){
          const group=el('div');
          group.append(el('dt',title),el('dd',copy));
          periods.append(group);
        }
        detail.append(periods);
      }
      for(const span of row.spans.filter(s=>s.start!==row.start)){
        detail.append(el('p','앞 구간 · '+span.until.slice(5,10).replace('-','.')+' '+span.until.slice(11,19)+' 절입 전에는 '+span.annual+'년 '+span.pair+'월이에요. 이때는 '+span.reading+'에 무게를 둬요.','sr-topic-perspective'));
      }
      if(reading.id==='seohwa')detail.append(lens,perspective);
      detail.append(exact);
    };
    for(const row of periods.calendar){
      const bar=button('','sr-wealth-bar',()=>choose(row,bar));
      bar.dataset.signal='normal';
      bar.dataset.periodMonth=String(row.month);
      const {open,change}=row.assessment.axes;
      bar.setAttribute('aria-label',row.month+'월, '+periods.highlights[0].label+' 지표 '+open.score+', 변화 지표 '+change.score);
      bar.setAttribute('aria-controls',detail.id);
      const track=el('span',null,'sr-wealth-track');
      track.setAttribute('aria-hidden','true');
      for(const [cls,count] of [['sr-wealth-fill',open.score],['sr-wealth-risk-fill',change.score]]){
        const fill=el('span',null,cls);fill.style.height=(100*count/scale)+'%';track.append(fill);
      }
      bar.append(track,el('span',row.month+'월'));
      graph.append(bar);
    }
    const start=periods.highlights[0].rows[0]||periods.calendar[0];
    choose(start,graph.children[start.month-1]);
    const heading=el('h3',career?'2027년 월별 직업운':reading.id==='ijun'?'2027년 월별 재회·인연운':'2027년 월별 인연 흐름');
    heading.id='relationshipMonthsHeading';heading.tabIndex=-1;
    section.append(heading,el('p','각 달에서 가장 긴 절기 구간의 풀이예요. 막대는 '+(career?'월주와 직업 관련 십성':'일지와 가까운 관계')+'을 중심으로 본 주제별 중요도예요. 동점은 앞선 달부터 보여줘요.'),legend,graph,detail);
    if(reading.id==='ijun')section.append(el('p','상대가 연락을 원하지 않는다고 밝혔다면 그 의사를 존중해 주세요.','sr-topic-perspective'));
    return section;
  }
  function relationshipTimeline(periods,reading){
    const career=reading.id==='mujin';
    const panel=el('section',null,'sr-wealth-timeline sr-topic-timeline');
    panel.append(el('h4',career?'직업 변화와 성장에 주목할 구간':'인연과 관계 변화에 주목할 구간'));
    const list=el('ol');
    const already=new Set();
    for(const [label,items] of [[career?'성장 단서':'인연의 접점',periods.opportunity],[career?'역할 변화':'관계 변화',periods.attention]]){
      for(const row of items){
        if(already.has(row.month))continue;
        already.add(row.month);
        const opening=periods.opportunity.includes(row),attention=periods.attention.includes(row);
        const item=el('li',null,'sr-wealth-timing');
        const labelText=opening&&attention?(career?'성장 단서 · 역할 변화':'인연의 접점 · 관계 변화'):label;
        const short=t=>t.slice(5,10).replace('-','.');
        const evidence=el('details',null,'sr-evidence');
        evidence.append(el('summary','절기 전체와 양력 표시 구간'),el('p','절기 월운 · '+row.solarFrom+'부터 '+row.solarUntil+' 직전까지'),el('p','양력 그래프 · '+row.from+'부터 '+row.until+' 직전까지'));
        const proof=periods.currentRanking?[opening&&row.assessment.axes.open.fact,attention&&row.assessment.axes.change.fact].filter(Boolean).join(' / '):row.insight.basis;
        item.append(el('p',labelText,'sr-period-rank'),el('h5',short(row.solarFrom)+' – '+short(row.solarUntil)+' · '+row.pair+' 월운'),el('p',proof),evidence);
        list.append(item);
      }
    }
    if(list.childElementCount)panel.append(el('p',periods.currentRanking?'본문에서 살펴본 대표 월운의 전체 절기 구간이에요.':'이 장은 발급 당시 본문에서 고른 시기예요. 첫 화면에서는 질문별로 주목할 달도 살펴볼 수 있어요.'),list);
    else panel.append(el('p','강조할 합이나 변화 관계가 확인된 달이 없어요.'));
    return panel;
  }
  function relationshipYears(periods,reading){
    const panel=el('section',null,'sr-wealth-outlook sr-topic-timeline');
    panel.append(el('h4',reading.id==='mujin'?'2027~2036년 직업운':'2027~2036년 인연 흐름'));
    const horizons=el('dl',null,'sr-summary-moments');
    for(const range of periods.horizons){
      const box=el('div');
      const describeYears=(label,years)=>years.length?label+' '+years.join('·')+'년':'';
      box.append(el('dt',range.length+'년 · '+range.from+'~'+range.through),
        el('dd',[describeYears('접점',range.opportunity),describeYears('변화',range.attention),describeYears('대운 전환',range.transitions)].filter(Boolean).join(' / ')));
      horizons.append(box);
    }
    const choices=el('div',null,'sr-year-picker');
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label','인연운 연도 선택');
    const detail=el('div',null,'sr-year-selected');
    detail.id='relationshipYearDetail';
    detail.setAttribute('aria-live','polite');
    function select(row,selected){
      for(const choice of choices.children)choice.setAttribute('aria-pressed',String(choice===selected));
      const year=el('div',null,'sr-wealth-year');
      year.append(el('h5',row.year+'년 · '+row.pair+' 세운'),relationshipReading(row,reading));
      for(const cycle of row.cycles)year.append(el('p',(cycle.transition?cycle.transition.slice(0,7).replace('-','년 ')+'월 무렵부터 ':'')+cycle.pair+' 대운'+(cycle.links.length?' · '+cycle.links.join(' / '):'')));
      if(!row.cycles.length)year.append(el('small','대운 시점이 확인되지 않아 입춘 기준 세운으로 읽어요.'));
      if(row.cycles.some(c=>c.transition))year.append(el('small','전환 월은 입력한 출생시간과 택일소의 기산 방식에 따른 추정이에요.'));
      detail.replaceChildren(year);
    }
    for(const row of periods.years){
      const buttonEl=button(String(row.year),'sr-year-choice',()=>select(row,buttonEl));
      const labels=[];
      if(row.affinity)labels.push(reading.id==='mujin'?'성장':'접점');
      if(row.adjustment)labels.push('변화');
      if(row.cycles.some(c=>c.transition))labels.push('대운 전환');
      if(labels.length)buttonEl.append(el('small',labels.join(' · ')));
      buttonEl.setAttribute('aria-controls',detail.id);
      choices.append(buttonEl);
    }
    select(periods.years[0],choices.firstElementChild);
    panel.append(horizons,choices,detail);
    return panel;
  }

  function drawPurchased(result,host,owner,reading) {
    window.TaekilCampaign?.activity('read_'+reading.topic);
    const {report}=result;
    displayTitle(reading);
    const now={id:result.id,host,owner,reading};active=now;
    const layout=el('div',null,'sr-layout'), contents=el('div',null,'sr-pages');
    const balance=el('p',reading.name+' 상담 '+result.questionsLeft+'회 남음','sr-balance');
    const paidWealth=reading.id==='dogyeom'&&report.calendar?.ranking;
    const front=[];
    const topic=topicPresentation[reading.id];
    let periods,pillars;
    if(topic){
      if(reading.id==='seohwa'||report.topicVersion>=2){
        const context=purchasedContext(reading,report);
        pillars=context.pillars;
        try{
          periods=window.TaekilRelationshipPeriods?.calc(window.Solar,window.LunarUtil,context.pillars,profileBirthDay(report.profile),report.profile,reading.id,{legacyRanking:!(report.topicVersion>=3),rankVersion:report.topicVersion>=4?8:7});
        }catch(error){console.warn('SEOHWA_PERIODS_UNAVAILABLE',error.name);}
      }
      front.push(reportOverview(report,reading,periods));
      if(periods)front.push(relationshipMonths(periods,reading,pillars));
    }
    if(paidWealth){
      const {year,judgment,ranking,rows,outlook,daewoon}=report.calendar;
      const summary=el('section',null,'sr-summary');
      summary.append(el('h3','올해 재물운 한눈에 보기'),el('p',report.calendar.version>=6?report.body[0].highlight:judgment.route.title,'sr-summary-lead'));
      const highlights=el('dl',null,'sr-summary-moments');
      const cycle=daewoon?.cycles?.find(c=>c.from?.startsWith(String(year)+'-'));
      const change=rows.find(row=>row.month===ranking.expense[0]);
      const listed=[
        ['재물 기회',ranking.opportunity[0]+'월',rows.find(row=>row.month===ranking.opportunity[0])?.basis],
        ['지출 주의',ranking.expense[0]+'월',change?.basis],
      ];
      if(cycle)listed.push(['대운 전환',cycle.from.slice(0,10),cycle.ganZhi+' 대운']);
      else if(outlook?.horizons?.length){
        const keyYear=outlook.horizons.at(-1).opportunity;
        if(keyYear)listed.push(['장기 재물 기회',keyYear+'년',outlook.years.find(y=>y.year===keyYear)?.basis]);
      }
      for(const [label,date,basis] of listed){
        const column=el('div');
        column.append(el('dt',label),el('dd',date,'sr-summary-date'));
        if(basis)column.append(el('dd',basis));
        highlights.append(column);
      }
      summary.append(highlights);
      if(report.calendar.natal){
        const natal=el('details',null,'sr-evidence');
        natal.append(el('summary','내 재물운을 읽은 원국 근거'));
        for(const pillar of report.calendar.natal)natal.append(el('p',pillar.position+' · 겉 '+pillar.visible+' · 지장간 '+pillar.hidden.join('·')));
        if(report.calendar.internal?.length)natal.append(el('p','원국 안에서 맞물리는 글자 · '+report.calendar.internal.join(' / ')));
        if(!report.calendar.pillars.hour)natal.append(el('p','출생시간 미상으로 시주를 제외했어요.'));
        if(!report.calendar.pillars.month||!report.calendar.pillars.year)natal.append(el('p','출생 시각에 따라 달라지는 기둥은 제외했어요.'));
        summary.append(natal);
      }
      front.push(summary,wealthRanking(report.calendar));
    }
    contents.append(balance);
    if(!paidWealth&&!topic)contents.append(introGuide(reading,purchasedContext(reading,report),report.first));
    for(const [index,chapter] of [report.first,...report.body].entries()){
      const page=paper(chapter,index,result.questionsLeft>0?()=>followup(result,chapter,index-1,owner,reading):null,reading);
      if(index===0&&!paidWealth&&report.calendar?.judgment){
        const highlight=page.querySelector('.sr-highlight');
        const judgment=wealthJudgment(report.calendar.judgment);
        if(report.calendar.ranking)highlight.after(wealthRanking(report.calendar),judgment);
        else highlight.after(judgment);
      }
      if(index===1&&report.calendar?.version>=6){
        const c=report.calendar,annual=c.outlook.years[0],summary=el('details',null,'sr-evidence');
        summary.append(el('summary','올해를 읽는 세 가지 단서'),el('h5','입춘을 지나 달라지는 기운'),
          el('p',c.prior.ganZhi+'년의 '+c.prior.basis+'에서 '+annual.ganZhi+'년의 '+annual.basis+'로 바뀌어요.'),
          el('h5','정미년과 내 원국의 관계'),el('p',annual.relations.join(' / ')||'정미와 직접 짝을 이루는 두 글자 관계는 확인되지 않아요. 십성의 변화에 무게를 두었어요.'),
          el('h5','반년씩 나눠 본 재물 기회'));
        for(const start of [0,6]){
          const best=c.rows.slice(start,start+6).reduce((a,b)=>a.score>=b.score?a:b);
          summary.append(el('p',(start?'하반기':'상반기')+'에서 기회 지표가 가장 높은 '+best.month+'월 · '+best.ganZhi+' · '+best.basis));
        }
        page.querySelector('.sr-evidence')?.before(summary);
      }
      if(index===2&&paidWealth){
        const jump=button('월별 그래프에서 내 흐름 보기','sr-ask',()=>{
          const heading=by('wealthCalendarHeading');
          heading.focus({preventScroll:true});
          heading.scrollIntoView({block:'start',behavior:'instant'});
        });
        page.querySelector('.sr-evidence')?.before(jump);
      }
      if(index===2&&report.calendar)page.querySelector('.sr-evidence')?.before(calendarArticle(report.calendar));
      if(index===5&&report.calendar?.outlook)page.querySelector('.sr-evidence')?.before(wealthOutlook(report.calendar.outlook,report.calendar));
      if(index===5&&paidWealth&&report.calendar.outlook){
        const c=report.calendar,year=c.outlook.years[0],cycles=c.daewoon?.cycles||[];
        const active=cycles.find(v=>v.ganZhi===year.cycles?.[0]?.ganZhi),next=active&&cycles[cycles.indexOf(active)+1];
        const opportunity=c.rows[c.ranking.opportunity[0]-1],risk=c.rows[c.ranking.expense[0]-1];
        const recap=el('section',null,'sr-wealth-outlook sr-wealth-recap'),list=el('ol');
        const items=[report.first.highlight,opportunity.month+'월 · '+opportunity.basis+' — '+opportunity.label,
          risk.month+'월 · '+risk.basis+' — '+risk.caution,
          active&&next?.from?active.ganZhi+' 대운의 '+active.basis+'에서 '+next.from.slice(0,10)+' 이후 '+next.ganZhi+' 대운의 '+next.basis+'로 달라져요.':'대운 전환 시점은 미확인이에요. 확인한 세운으로 흐름을 읽었어요.',chapter.highlight];
        const labels=['타고난 재물 구조','올해의 재물 기회','신중함이 필요한 달','대운의 변화','10년 장기 흐름'];
        for(const [i,text] of items.entries()){
          const item=el('li');
          item.append(el('strong',labels[i]),el('p',text));
          list.append(item);
        }
        recap.append(el('h4','내 재물운에서 기억할 다섯 가지'),list);page.append(recap);
      }
      if(periods&&index===2){
        const calendarLink=button('월별 인연 흐름 보기','sr-ask',()=>{
          const heading=by('relationshipMonthsHeading');
          heading.focus({preventScroll:true});
          heading.scrollIntoView({block:'start',behavior:'instant'});
        });
        page.querySelector('.sr-evidence')?.before(calendarLink);
      }
      if(periods&&index===(report.topicVersion>=2?4:3))page.querySelector('.sr-evidence')?.before(relationshipTimeline(periods,reading));
      if(periods&&index===5)page.querySelector('.sr-evidence')?.before(relationshipYears(periods,reading));
      if(topic&&index===5){
        const recap=el('section',null,'sr-topic-recap');
        const list=el('ol');
        for(const [label,i] of report.topicVersion>=2?newSteps[reading.id]:topic.steps){
          const item=el('li');
          item.append(el('strong',label),el('p',report.body[i].highlight));
          list.append(item);
        }
        recap.append(el('h4',topic.recap),list);
        page.append(recap);
      }
      if((paidWealth||topic)&&index===0){
        const first=el('details',null,'sr-paid-details');
        if(topic)page.append(introGuide(reading,purchasedContext(reading,report),report.first));
        first.append(el('summary','무료 첫 장 다시 보기'),page);
        contents.append(first);
      }else{
        if(paidWealth||topic){
          const more=el('details',null,'sr-paid-details');
          more.append(el('summary','상세 풀이 읽기'));
          for(const paragraph of page.querySelectorAll(':scope > p:not(.sr-page-label):not(.sr-highlight)'))more.append(paragraph);
          page.querySelector('.sr-highlight').after(more);
          if(paidWealth&&(index===3||index===4)){
            const timeline=wealthTimeline(report.calendar,index===3?'opportunity':'expense');
            page.querySelector('.sr-evidence')?.before(timeline);
          }
        }
        const ask=page.querySelector('.sr-ask');
        if((paidWealth||topic)&&ask)page.append(ask);
        contents.append(page);
      }
    }
    layout.append(toc({...reading,chapters:report.body.map(chapter=>chapter.title)},report.first,false),contents);
    show([header(reading,report.choice,report.day,report.known??report.profile?.hourValue!=='unknown',
      paidWealth?report.calendar.year:topic?true:undefined,report.profile),...front,layout],!paidWealth&&!topic);
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
    if(active.previewPending){active.focusCheckout=true;return;}
    const status=body.querySelector('.sr-gate .sr-status');
    const pay=body.querySelector('.sr-gate button[data-checkout-action]');
    if(!status||!pay?.getClientRects().length)return;
    setStatus(status,'로그인됐어요. 결제창을 열어 이어서 진행해 주세요.');
    pay.focus({preventScroll:true});
    pay.scrollIntoView({block:'center',behavior:'instant'});
  }
  window.TaekilSeohwaReport={openPreview,session,setBalance,recordScope,restoreScope,showChatAccess,showRestoredBalance,shouldResume,focusCheckoutAfterLogin};
})();
