(() => {
  'use strict';
  const core=window.TaekilSeohwaReading, client=window.TaekilAccountReport, checkout=window.TaekilCheckout;
  const endpoint='https://taekilso-api-jhqz3vlila-du.a.run.app/api/seohwa-report';
  const pendingKey='seohwa-pending-report-v1';
  const restoreKey='taekilso_resume_seohwa_report_v1';
  const by=id=>document.getElementById(id);
  const dialog=by('seohwaReportDialog'), body=by('seohwaReportBody');
  const writingVisual=by('seohwaWritingVisual');
  const writingFilm=writingVisual.querySelector('video');
  const progress=by('seohwaReportProgress');
  const library=by('seohwaReportList'), libraryStatus=by('seohwaLibraryStatus');
  const returnView=by('view-seohwa-report'), returnHost=by('seohwaReturnHost');
  const returnStatus=by('seohwaReturnStatus'), returnRetry=by('seohwaReturnRetry'), returnAuth=by('seohwaReturnAuth');
  let active, loadingLibrary=0, accountOwner=accountStore.owner(), waitingLogin=false;
  let returnAttempt=null;
  let progressTimer=0, statusTimer=0;
  const typicalWriteSeconds=60;
  const estimatedWriteMs=(typicalWriteSeconds+10)*1000;
  const money=new Intl.NumberFormat('ko-KR').format(core.PRICE)+'원';
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
  }
  function close() {
    clearGenerationTimers();
    if(dialog.open)dialog.close();
    active=null;
    body.replaceChildren();
  }
  by('closeSeohwaReport').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('scroll',()=>{
    progress.value=dialog.scrollTop/Math.max(1,dialog.scrollHeight-dialog.clientHeight);
  },{passive:true});

  function paper(chapter,index,followup) {
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
    if(followup) page.append(button('이 대목으로 서화에게 묻기','sr-ask',followup));
    return page;
  }

  function header(choice,day,known) {
    const head=el('header',null,'sr-cover');
    const image=el('img');
    image.src='/assets/portrait-love.jpg'; image.alt='';
    image.width=640; image.height=800;
    head.append(image);
    const title=el('div',null,'sr-cover-text');
    title.append(el('p','서화의 연애 리포트','sr-kicker'),el('h2','마음이 가까워지는 순간과 엇갈리는 이유'),
      el('p',core.stories[choice].label+(day?' · '+day+'일주':'')+
        (known===false?' · 출생시간 미상, 공통 근거로 풀이':'')));
    head.append(title);
    return head;
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

  function toc(first,locked) {
    const list=el('nav',null,'sr-toc');
    list.setAttribute('aria-label','리포트 목차');
    list.append(el('h3','리포트 목차'));
    const rows=el('ol');
    for(const [index,title] of [first.title,...core.chapters].entries()){
      const row=el('li');
      if(locked&&index>0){
        const chapter=el('div');
        chapter.append(el('strong',title),el('small',core.guide[index-1]));
        row.className='sr-locked-row';
        row.append(lockIcon(),chapter);
      }else{
        row.append(button(title,'sr-jump',()=>{
          const heading=by('seohwa-report-chapter-'+index)?.querySelector('h3');
          heading?.focus({preventScroll:true});
          heading?.scrollIntoView({block:'start'});
        }));
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
    const {first,context,choice,excerpts}=data;
    const layout=el('div',null,'sr-layout'), contents=el('div',null,'sr-pages'), gate=el('section',null,'sr-gate');
    const status=el('p',null,'sr-status');
    status.setAttribute('role','status');
    const pay=button(money+'에 전체 리포트 열기','sr-primary',()=>buy(data,status));
    pay.dataset.checkoutAction='';
    const paused=el('p','현재 전체 리포트 구매를 잠시 중단했어요.','sr-payment-note');
    paused.dataset.checkoutPaused='';
    const paymentNote=el('p','1회 결제 · 자동 갱신 없음','sr-payment-note');
    paymentNote.dataset.checkoutAction='';
    const benefits=el('ul',null,'sr-benefits');
    for(const [title,description] of [
      ['리포트 6장 분량','무료 첫 장을 포함한 전체 리포트를 내 기록에서 다시 읽을 수 있어요.'],
      ['서화와 채팅 상담 3회','마음에 남은 대목에서 바로 이어서 물어볼 수 있어요.']
    ]){
      const benefit=el('li');
      benefit.append(el('strong',title),el('span',description));
      benefits.append(benefit);
    }
    gate.append(el('h3','전체 리포트와 서화 상담'),benefits,
      pay,status,paused,paymentNote,
      button('일반 서화 상담으로 이어가기','sr-secondary',()=>{close();data.chat();}));
    const samples=el('section',null,'sr-samples');
    samples.setAttribute('aria-labelledby','sr-sample-title');
    const label=el('h3','이어지는 장 미리보기');
    label.id='sr-sample-title';
    samples.append(label);
    for(const {index,text} of excerpts){
      const sample=el('article',null,'sr-sample');
      sample.append(el('h4',core.chapters[index]),el('p',text),
        el('p','이 장의 첫 문단을 공개했어요.','sr-excerpt-label'));
      samples.append(sample);
    }
    contents.append(paper(first,0),samples,gate);
    layout.append(toc(first,true),contents);
    show([header(choice,context.day,context.known),layout]);
  }

  function openPreview({profile,choice,chat,auth}) {
    const birth=resolveBirthDate([profile.y,String(profile.m).padStart(2,'0'),String(profile.d).padStart(2,'0')].join('-'),profile.calType,profile.isLeap);
    if(!birth)return;
    const day=[birth.getFullYear(),String(birth.getMonth()+1).padStart(2,'0'),String(birth.getDate()).padStart(2,'0')].join('-');
    const today=new Date(Date.now()+9*3600000);
    const cutoff=new Date(Date.UTC(today.getUTCFullYear()-14,today.getUTCMonth(),today.getUTCDate()));
    if(day>cutoff.toISOString().slice(0,10))throw Error('만 14세 미만의 출생 정보는 사용할 수 없어요.');
    const context=core.timeSlots(day,profile.hourValue,window.Solar,window.LunarUtil);
    const data={profile,choice,chat,auth,context,first:core.first(context,choice),excerpts:core.excerpts(context,choice),host:by('aiChatSetup'),owner:accountStore.snapshot()};
    active=data;
    drawPreview(data);
  }
  async function buy(data,status) {
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
        const result=await client.request(endpoint,{operation:'prepare',comparison:{profile:data.profile,choice:data.choice},allowResume:true},owner);
        if(!current()) return false;
        if(result.id && ['paid','generating','ready'].includes(result.state)){
          await renderPurchased(result,data.host,owner);return false;
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
        const order=await client.request(endpoint,{operation:'prepare',comparison:{profile:data.profile,choice:data.choice},checkout:true,allowResume:true},owner);
        if(!current())return false;
        if(order.id && ['paid','generating','ready'].includes(order.state)){await renderPurchased(order,data.host,owner);return false;}
        if(order.state==='resume'){client.showResume(status,order,pendingKey);return false;}
        if(order.state==='pending'){
          accountStore.setItem(pendingKey,order.id);
          close();
          goTo('seohwa-report');
          return false;
        }
        if(order.state==='paused'){setStatus(status,'신규 결제를 잠시 중단했어요.');return false;}
        const returnPath='/?seohwaReport=1&seohwaOrder='+encodeURIComponent(order.orderId)+'#seohwa-report';
        const opened=client.pay(order,{price:core.PRICE,name:core.NAME,payAppName:'서화 연애 리포트 상담 3회',pendingKey,returnPath,memo:'서화 연애 리포트 및 후속 상담 3회'});
        if(!opened)setStatus(status,'결제창을 열지 못했어요. 결제 상태를 다시 확인해 주세요.');
        return opened;
      }catch(error){
        if(sameUser()&&closedForConsent)dialog.showModal();
        if(current())setStatus(status,error.message);
        return false;
      }
    });
  }
  function drawPurchased(result,host,owner) {
    const {report}=result;
    const now={id:result.id,host,owner};active=now;
    const layout=el('div',null,'sr-layout'), contents=el('div',null,'sr-pages');
    const balance=el('p','서화 상담 '+result.questionsLeft+'회 남음','sr-balance');
    contents.append(balance);
    for(const [index,chapter] of [report.first,...report.body].entries()){
      contents.append(paper(chapter,index,result.questionsLeft>0?()=>followup(result,chapter,index-1,owner):null));
    }
    layout.append(toc(report.first,false),contents);
    show([header(report.choice,report.day,report.profile.hourValue!=='unknown'),layout],true);
  }

  async function renderPurchased(result,host,owner,autoGenerate=false) {
    if(!accountStore.current(owner))return;
    clearGenerationTimers();
    if(result.state==='ready'){drawPurchased(result,host,owner);return;}
    const state={id:result.id,host,owner};active=state;
    const stillCurrent=()=>active===state&&accountStore.current(owner);
    const panel=el('section',null,'sr-generation');
    const content=el('div',null,'sr-generation-copy');
    const heading=el('h2','리포트를 준비하고 있어요');
    const message=el('p','결제를 확인했어요.','sr-status');
    message.setAttribute('role','status');
    const meter=el('div',null,'sr-generation-meter');
    meter.hidden=true;
    const meterLine=el('div',null,'sr-generation-meter-label');
    const meterLabel=el('span','예상 진행률');
    const eta=el('p','예상 소요 시간 약 '+typicalWriteSeconds+'초','sr-generation-eta');
    const number=el('strong','0%');
    number.setAttribute('aria-hidden','true');
    const bar=el('progress');
    bar.max=100;bar.value=0;
    bar.setAttribute('aria-label','리포트의 예상 작성 진행률');
    meterLine.append(meterLabel,number);
    meter.append(meterLine,bar,eta);
    const after=el('p','리포트 6장 · 서화와 채팅 상담 3회','sr-generation-next');
    const action=button('전체 리포트 만들기','sr-secondary sr-generation-action',generate);
    action.hidden=autoGenerate||result.state==='generating';
    content.append(heading,message,meter,after,action);
    writingVisual.hidden=false;
    if(writingFilm.ended)writingFilm.currentTime=0;
    panel.append(writingVisual,content);
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
      heading.textContent='서화가 본편을 쓰고 있어요';
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
      heading.textContent='리포트가 완성됐어요';
      action.hidden=true;
      meterLabel.textContent='리포트 작성 완료';
      eta.hidden=true;
      bar.setAttribute('aria-label','리포트 작성 완료');
      setProgress(100);
      setStatus(message,'잠시 후 본편이 열려요.');
      setTimeout(()=>{if(stillCurrent())drawPurchased(ready,host,owner);},650);
    }
    function offerRetry(text) {
      clearGenerationTimers();
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
          const latest=await client.request(endpoint,{operation:'open',id:state.id},owner);
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
        const latest=await client.request(endpoint,{operation:'open',id:state.id},owner);
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
        const generated=await client.request(endpoint,{operation:'generate',id:state.id},owner,150000);
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

  async function followup(result,chapter,index,owner) {
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
    await startAiChat({source:'free-report',consultantId:'seohwa'});
    if(!accountStore.current(owner)||window.__aiConsultantId!=='seohwa'||by('aiChatPanel').style.display!=='flex')return;
    window.__seohwaReportSession={owner,id:result.id,chapter:index,conversationId:window.__aiConversationId};
    window.TaekilSeohwaReport.setBalance(result.questionsLeft);
    prepareAiQuestion('리포트의 “'+chapter.highlight+'” 부분을 제 상황에 맞춰 좀 더 풀어주세요.');
  }

  async function reopen(id,owner,status) {
    const visible=()=>accountStore.current(owner)&&by('view-history').classList.contains('visible');
    try{
      const result=await client.request(endpoint,{operation:'open',id,allowResume:true},owner);
      if(!visible())return;
      if(result.state==='resume'){client.showResume(status,result,pendingKey);return;}
      if(result.state==='pending'){setStatus(status,client.pendingMessage(result));return;}
      if(!['paid','ready','generating'].includes(result.state)) throw Error('현재 열 수 있는 리포트가 아니에요. 결제 상태를 확인해 주세요.');
      if(accountStore.getItem(pendingKey)===id)accountStore.removeItem(pendingKey);
      setStatus(status,'결제한 서화 리포트를 열었어요.');
      await renderPurchased(result,by('seohwaLibrary'),owner);
    }catch(error){if(accountStore.current(owner))setStatus(status,error.message);}
  }
  async function list() {
    const owner=accountStore.snapshot();
    if(!owner.owner){openAuthModal();return;}
    const version=++loadingLibrary, trigger=by('loadSeohwaReports');
    trigger.disabled=true;
    const current=()=>accountStore.current(owner)&&version===loadingLibrary;
    setStatus(libraryStatus,'서화 리포트를 불러오고 있어요.');
    try{
      const {reports}=await client.request(endpoint,{operation:'list'},owner);
      if(!current())return;
      const rows=reports.map(record=>{
        const date=new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeZone:'Asia/Seoul'}).format(record.createdAtMs);
        return button(date+' · '+core.stories[record.choice].label+' 보기','sr-library-button',()=>reopen(record.id,owner,libraryStatus));
      });
      const pending=accountStore.getItem(pendingKey);
      if(pending&&!reports.some(item=>item.id===pending))rows.unshift(button('최근 결제 상태 확인하기','sr-library-button',()=>reopen(pending,owner,libraryStatus)));
      library.replaceChildren(...rows);
      setStatus(libraryStatus,reports.length?'최근 리포트부터 표시해요.':'저장한 서화 리포트가 아직 없어요.');
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
    if(!owner.owner){
      if(firebaseReady&&!firebaseAuthReady)return;
      setStatus(returnStatus,'결제하신 계정으로 로그인하면 리포트 준비를 이어갈 수 있어요.');
      returnAuth.hidden=false;
      return;
    }
    const url=new URL(location.href);
    const orderId=url.searchParams.get('seohwaOrder');
    const pending=accountStore.getItem(pendingKey);
    const request=orderId?{operation:'checkout-status',orderId}:{operation:'open',id:pending,allowResume:true};
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
        const result=await client.request(endpoint,request,owner);
        if(!current())return;
        if(['paid','generating','ready'].includes(result.state)){
          if(orderId&&accountStore.getItem(pendingKey)===result.id)accountStore.removeItem(pendingKey);
          setStatus(returnStatus,result.state==='ready'?'완성된 리포트를 다시 열 수 있어요.':'결제가 확인됐어요. 리포트 준비를 이어갈 수 있어요.');
          returnRetry.textContent='리포트 다시 열기';
          await renderPurchased(result,returnHost,owner,true);
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
  if(returnUrl.searchParams.get('seohwaReport')==='1'&&(!returnUrl.hash||returnUrl.hash==='#history')){
    returnUrl.hash='seohwa-report';
    history.replaceState(history.state,'',returnUrl);
  }
  by('loadSeohwaReports').addEventListener('click',()=>list());
  returnRetry.addEventListener('click',()=>{
    returnRetry.textContent='결제 상태 다시 확인';
    void checkCheckoutReturn();
  });
  returnAuth.addEventListener('click',()=>openAuthModal());
  returnHost.querySelector('a[href="#topic-love"]').addEventListener('click',event=>{
    event.preventDefault();
    goTo('topic-love');
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
      if(url.hash!=='#seohwa-report'&&url.searchParams.get('seohwaReport')==='1'){
        url.searchParams.delete('seohwaReport');
        url.searchParams.delete('seohwaOrder');
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
    libraryStatus.textContent='구매한 서화 리포트를 여기서 다시 읽을 수 있어요.';
    void checkCheckoutReturn();
  });

  function session() {
    const locked=window.__seohwaReportSession;
    return locked && locked.conversationId===window.__aiConversationId && window.__aiConsultantId==='seohwa' &&
      accountStore.current(locked.owner) ? locked : null;
  }
  function setBalance(count) {by('aiChatStatus').textContent='서화 리포트 상담 '+count+'회 남음';}
  function recordScope() {
    const linked=session();
    return linked?{seohwaReportId:linked.id,seohwaChapter:linked.chapter}:{};
  }
  function restoreScope(record,owner) {
    window.__seohwaReportSession=record.consultantId==='seohwa'&&/^[a-f0-9]{64}$/.test(record.seohwaReportId)
      ? {owner,id:record.seohwaReportId,chapter:record.seohwaChapter,conversationId:record.id}:null;
  }
  async function showRestoredBalance() {
    const linked=session();
    if(!linked)return;
    const status=by('aiChatStatus');
    status.textContent='서화 리포트 상담 · 남은 횟수 확인 중';
    try{
      const data=await client.request(endpoint,{operation:'open',id:linked.id},linked.owner);
      if(session()===linked&&Number.isInteger(data.questionsLeft)&&status.textContent.endsWith('확인 중'))setBalance(data.questionsLeft);
    }catch{
      if(session()===linked&&status.textContent.endsWith('확인 중'))status.textContent='서화 리포트 상담 · 내 기록에서 이용 상태 확인';
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
    const status=body.querySelector('.sr-gate .sr-status');
    const pay=body.querySelector('.sr-gate button[data-checkout-action]');
    if(!status||!pay?.getClientRects().length)return;
    setStatus(status,'로그인됐어요. 결제창을 열어 이어서 진행해 주세요.');
    pay.focus({preventScroll:true});
    pay.scrollIntoView({block:'center',behavior:'instant'});
  }
  window.TaekilSeohwaReport={openPreview,session,setBalance,recordScope,restoreScope,showRestoredBalance,shouldResume,focusCheckoutAfterLogin};
})();
