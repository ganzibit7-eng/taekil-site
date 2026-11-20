(() => {
  'use strict';
  const core=window.TaekilSeohwaReading, client=window.TaekilAccountReport, checkout=window.TaekilCheckout;
  const endpoint='https://taekilso-api-jhqz3vlila-du.a.run.app/api/seohwa-report';
  const pendingKey='seohwa-pending-report-v1';
  const restoreKey='taekilso_resume_seohwa_report_v1';
  const by=id=>document.getElementById(id);
  const dialog=by('seohwaReportDialog'), body=by('seohwaReportBody');
  const progress=by('seohwaReportProgress');
  const library=by('seohwaReportList'), libraryStatus=by('seohwaLibraryStatus');
  let active, loadingLibrary=0, accountOwner=accountStore.owner(), waitingLogin=false;
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
  function close() { if(dialog.open)dialog.close(); active=null; body.replaceChildren(); }
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

  function toc(first,locked) {
    const list=el('nav',null,'sr-toc');
    list.setAttribute('aria-label','리포트 목차');
    list.append(el('h3','리포트 목차'));
    const rows=el('ol');
    for(const [index,title] of [first.title,...core.chapters].entries()){
      const row=el('li');
      if(locked&&index>0){
        row.append(el('span','잠금','sr-lock'),el('strong',title),el('small',core.guide[index-1]));
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
    const pay=button(money+'에 전체 리포트 열기','sr-primary',()=>buy(data,pay,status));
    pay.dataset.checkoutAction='';
    const paused=el('p','현재 전체 리포트 구매를 잠시 중단했어요.','sr-payment-note');
    paused.dataset.checkoutPaused='';
    const paymentNote=el('p','1회 결제 · 자동 갱신 없음','sr-payment-note');
    paymentNote.dataset.checkoutAction='';
    gate.append(el('h3','이어지는 다섯 장과 서화 상담 3회'),
      el('p','본편까지 읽고 문단에서 바로 서화에게 물어볼 수 있어요. 구입한 리포트는 내 기록에서 다시 열 수 있어요.'),
      pay,paused,paymentNote,
      button('일반 서화 상담으로 이어가기','sr-secondary',()=>{close();data.chat();}),status);
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
    const data={profile,choice,chat,auth,context,first:core.first(context,choice),excerpts:core.excerpts(context,choice),host:by('aiChatSetup')};
    active=data;
    drawPreview(data);
  }
  async function buy(data,pay,status) {
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
        if(!await checkout.loadSdk()||!current())return false;
        const order=await client.request(endpoint,{operation:'prepare',comparison:{profile:data.profile,choice:data.choice},checkout:true,allowResume:true},owner);
        if(!current())return false;
        if(order.id && ['paid','generating','ready'].includes(order.state)){await renderPurchased(order,data.host,owner);return false;}
        if(order.state==='resume'){client.showResume(status,order,pendingKey);return false;}
        if(order.state==='pending'){
          accountStore.setItem(pendingKey,order.id);
          setStatus(status,client.pendingMessage(order));return false;
        }
        if(order.state==='paused'){setStatus(status,'신규 결제를 잠시 중단했어요.');return false;}
        return client.pay(order,{price:core.PRICE,name:core.NAME,pendingKey,returnFlag:'seohwaReport',memo:'서화 연애 리포트 및 후속 상담 3회'});
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
    if(result.state==='ready'){drawPurchased(result,host,owner);return;}
    const state={id:result.id,host,owner};active=state;
    const message=el('p',result.state==='generating'?'본편을 만들고 있어요. 잠시 뒤 같은 리포트에서 확인할 수 있어요.':'결제를 확인했어요. 서화가 사주와 고른 고민을 이어서 풀이해요.','sr-status');
    message.setAttribute('role','status');
    const panel=el('section',null,'sr-gate sr-generation');
    const action=button(result.state==='generating'?'완성 여부 확인하기':'전체 리포트 만들기','sr-primary',generate);
    panel.append(el('p','서화의 연애 리포트','sr-kicker'),el('h2','전체 리포트 준비'),message,action);
    show([panel]);
    if(autoGenerate&&result.state==='paid')void generate();
    async function generate(){
      if(action.disabled||active!==state||!accountStore.current(owner))return;
      action.disabled=true;
      let hiddenForConsent=false;
      let loading=false;
      const stillCurrent=()=>active===state&&accountStore.current(owner);
      try{
        const latest=await client.request(endpoint,{operation:'open',id:state.id},owner);
        if(!stillCurrent())return;
        if(latest.state==='ready'){drawPurchased(latest,host,owner);return;}
        if(latest.state==='generating'){setStatus(message,'본편을 만들고 있어요. 잠시 뒤 다시 확인해 주세요.');return;}
        if(latest.state!=='paid')throw Error('현재 열람할 수 없는 리포트예요. 내 기록에서 결제 상태를 확인해 주세요.');
        dialog.close();
        hiddenForConsent=true;
        const agreed=await window.TaekilPrivacy.confirmAI(host);
        if(!stillCurrent()||!host.closest('.view')?.classList.contains('visible')){if(active===state)active=null;return;}
        dialog.showModal();
        hiddenForConsent=false;
        if(!agreed){setStatus(message,'AI 이용에 동의하면 전체 리포트를 만들 수 있어요. 결제한 리포트는 내 기록에서 다시 열 수 있어요.');return;}
        loading=true;
        setStatus(message,'서화가 본편을 작성하고 있어요. 완성되면 내 기록에 저장돼요.');
        action.textContent='리포트 생성 중';
        const generated=await client.request(endpoint,{operation:'generate',id:state.id},owner,150000);
        if(stillCurrent())await renderPurchased(generated,host,owner);
      }catch(error){
        if(stillCurrent()){
          if(hiddenForConsent&&host.closest('.view')?.classList.contains('visible'))dialog.showModal();
          setStatus(message,loading&&['TimeoutError','AbortError'].includes(error.name)?'작성 상태를 바로 확인하지 못했어요. 내 기록에서 다시 열어 주세요.':error.message);
        }
      }finally{action.disabled=false;action.textContent='리포트 상태 확인하기';}
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

  async function reopen(id,owner,status,waitForPayment=false) {
    const visible=()=>accountStore.current(owner)&&by('view-history').classList.contains('visible');
    try{
      let result=await client.request(endpoint,{operation:'open',id,allowResume:true},owner);
      for(let i=0;waitForPayment&&visible()&&['pending','resume'].includes(result.state)&&result.waiting!=='deposit'&&i<6;i++){
        setStatus(status,'결제 결과를 기다리고 있어요.');
        await new Promise(resolve=>setTimeout(resolve,2300));
        if(!visible())return;
        result=await client.request(endpoint,{operation:'open',id,allowResume:true},owner);
      }
      if(!visible())return;
      if(result.state==='resume'){client.showResume(status,result,pendingKey);return;}
      if(result.state==='pending'){setStatus(status,client.pendingMessage(result));return;}
      if(!['paid','ready','generating'].includes(result.state)) throw Error('현재 열 수 있는 리포트가 아니에요. 결제 상태를 확인해 주세요.');
      accountStore.removeItem(pendingKey);
      setStatus(status,'결제한 서화 리포트를 열었어요.');
      await renderPurchased(result,by('seohwaLibrary'),owner,waitForPayment);
    }catch(error){if(accountStore.current(owner))setStatus(status,error.message);}
  }
  async function list(openPending=false) {
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
      if(openPending===true&&pending) await reopen(pending,owner,libraryStatus,true);
    }catch(error){if(current())setStatus(libraryStatus,error.message);}
    finally{if(current())trigger.disabled=false;}
  }
  function finishCheckout(){
    const url=new URL(location.href);
    if(!accountStore.owner()||!url.searchParams.has('seohwaReport'))return;
    url.searchParams.delete('seohwaReport');
    history.replaceState(null,'',url);
    goTo('history');
    void list(true);
    by('seohwaLibrary').scrollIntoView({block:'start'});
  }
  by('loadSeohwaReports').addEventListener('click',()=>list());
  window.addEventListener('DOMContentLoaded',finishCheckout,{once:true});
  window.addEventListener('taekilso:authChanged',()=>{
    const next=accountStore.owner();
    if(next===accountOwner)return;
    accountOwner=next; close(); window.__seohwaReportSession=null;
    loadingLibrary++; library.replaceChildren(); by('loadSeohwaReports').disabled=false;
    libraryStatus.textContent='구매한 서화 리포트를 여기서 다시 읽을 수 있어요.';
    finishCheckout();
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
  window.TaekilSeohwaReport={openPreview,session,setBalance,recordScope,restoreScope,showRestoredBalance,shouldResume};
})();
