(() => {
  'use strict';
  const field = id => document.getElementById(id);
  const endpoint = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/relationship-report';
  const price = 3900;
  const checkout = window.TaekilCheckout;
  const client = window.TaekilAccountReport;
  const decision = window.TaekilReportDecision;
  const pendingKey = 'taekilso_pending_relationship_report';
  const view = field('view-relationship-report');
  const form = field('relationshipReportForm');
  const review = field('relationshipReview');
  const output = field('relationshipReportOutput');
  const formError = field('relationshipFormError');
  const purchaseStatus = field('relationshipPurchaseStatus');
  const example = field('relationshipExample');
  const library = field('relationshipLibraryList');
  const libraryStatus = field('relationshipLibraryStatus');
  const libraryButton = field('relationshipLoadLibrary');
  const buyButton = field('buyRelationshipReport');
  const paymentCopy = buyButton.closest('[data-relationship-payment-copy]');
  const adminButton = el('button',client.adminLabel,'btn btn-primary');
  adminButton.type='button';
  const people = ['Mine','Partner'].map(role => ({
    birth:field('relationship'+role+'Date'),
    calendar:field('relationship'+role+'Calendar'),
    leap:field('relationship'+role+'Leap')
  }));
  let comparison = null;
  let owner = accountStore.owner();
  let listVersion = 0;

  function el(tag,text,className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function label(person) {
    return `${person.day}(${person.hanja}) · ${person.stem} / ${person.branch}`;
  }

  function entries(title, items) {
    const section = el('section');
    section.append(el('h4',title));
    const list = el('dl');
    for(const item of items) list.append(el('dt',item.title),el('dd',item.detail));
    section.append(list);
    return section;
  }

  function chapterGuide(report) {
    const section=el('section','','relationship-chapters');
    section.append(el('h4','상황별로 읽는 두 사람의 관계'),
      el('p','두 사람이 태어난 날을 비교해 열두 장면에서 서로를 이해하는 법을 담았어요.'));
    for(const chapter of report.chapters){
      const panel=el('section','','relationship-chapter');
      panel.append(el('h5',chapter.title),el('p',chapter.scene),el('p',chapter.reading));
      const dialogue=el('div','','relationship-dialogue');
      let opening;
      for (const [speaker,line] of [['본인',chapter.first],['상대방',chapter.second]]) {
        const quote=el('blockquote'), text=el('p',line);
        quote.append(el('b',speaker),text);
        dialogue.append(quote);
        if (!opening) opening=text;
      }
      const controls=el('div','','relationship-copy-controls');
      controls.append(...copyControl(opening,chapter.first));
      dialogue.append(controls);
      const action=el('p','','relationship-next-step');
      action.append(el('strong','함께 해볼 일'),document.createTextNode(' '+chapter.action));
      panel.append(dialogue,action);
      const basis=report.evidence[chapter.basis];
      if (basis) {
        const reason=el('details','','relationship-scene-basis');
        reason.append(el('summary','풀이 근거 보기'),el('p',basis.title+' · '+basis.detail));
        panel.append(reason);
      }
      section.append(panel);
    }
    return section;
  }

  function copyControl(quote,line) {
    const button=el('button','첫 문장 복사','relationship-copy');
    button.type='button';
    const status=el('span','','relationship-copy-status');
    status.setAttribute('role','status');
    button.addEventListener('click',async()=>{
      status.textContent='';
      try {
        await navigator.clipboard.writeText(line);
        status.textContent='복사했어요.';
      } catch (_) {
        const selection=window.getSelection();
        if (!selection) { status.textContent='첫 문장을 직접 길게 눌러 복사해 주세요.'; return; }
        const range=document.createRange();
        range.selectNodeContents(quote);
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent='첫 문장을 선택했어요. 복사를 눌러 주세요.';
      }
    });
    return [button,status];
  }

  function pillarComparison(report) {
    const section=el('section','','relationship-pillar-comparison');
    section.append(el('h4','두 사람의 풀이 기준'));
    const pair=el('div','','relationship-pillar-pair');
    report.people.forEach((person,index)=>{
      const profile=el('div');
      profile.append(el('b',index===0?'본인':'상대방'),el('strong',person.day+'('+person.hanja+')'),
        el('p','의견을 꺼내는 방식 · '+person.stem+' 기운'),
        el('p','생활의 속도를 맞추는 방식 · '+person.branch+' 기운'));
      pair.append(profile);
    });
    section.append(pair);
    const summary=el('ul');
    for(const basis of report.evidence)summary.append(el('li',basis.title+' · '+basis.relation));
    section.append(summary,el('p','두 분이 태어난 날의 위 글자(일간)와 아래 글자(일지)를 나누어 비교했어요.'));
    return section;
  }

  function reportCard(report,expiresAtMs) {
    const card = el('article','','relationship-reading report-sheet report-reading-shell');
    card.append(el('p','택일소 · 관계','report-folio'),el('h3','두 사람 관계 리포트'));
    const expiry=client.expiryNote(expiresAtMs);
    if(expiry)card.append(expiry);
    card.append(el('p',report.summary,'relationship-summary'));
    const practice = el('section');
    const practiceTitle=el('h4','실제로 써볼 대화');
    practiceTitle.tabIndex=-1;
    const jump=el('button','대화 예시 바로 보기','relationship-copy');
    jump.type='button';
    jump.addEventListener('click',()=>{
      practiceTitle.focus({preventScroll:true});
      practiceTitle.scrollIntoView({block:'start',behavior:'instant'});
    });
    card.append(pillarComparison(report),jump,entries('잘 맞는 점',report.strengths),entries('자주 엇갈릴 수 있는 상황',report.friction));
    if (report.chapters?.length) card.append(chapterGuide(report));
    practice.append(practiceTitle);
    report.conversations.forEach((conversation,index) => {
      const scene = el('div','','relationship-dialogue');
      scene.append(el('h5',conversation.title));
      const guide=decision.conversationGuide(report,index);
      if (guide) scene.append(el('p',guide.useWhen,'relationship-use-when'));
      let openingLine;
      for(const [speaker,line] of [['본인',conversation.first],['상대방',conversation.second]]) {
        const quote = el('blockquote');
        const text=el('p',line);
        quote.append(el('b',speaker),text);
        scene.append(quote);
        if (!openingLine) openingLine=text;
      }
      if (guide) {
        const agreement=el('p','','relationship-agreement');
        agreement.append(el('strong','대화 끝에 정할 것'),document.createTextNode(' '+guide.agree));
        scene.append(agreement);
        if (guide.basis) {
          const reason=el('details','','relationship-scene-basis');
          reason.append(el('summary','이 대화의 사주 근거'),el('p',guide.basis.title+' · '+guide.basis.detail));
          scene.append(reason);
        }
      }
      const controls=el('div','','relationship-copy-controls');
      controls.append(...copyControl(openingLine,conversation.first));
      scene.append(controls);
      practice.append(scene);
    });
    practice.append(el('p',report.nextStep,'relationship-next-step'));
    const evidence = el('details');
    evidence.append(el('summary','풀이에 사용한 계산 근거'),
      el('p','본인 '+label(report.people[0])+' · 상대방 '+label(report.people[1]),'relationship-pillars'),
      entries('두 사람의 오행 비교',report.evidence.map(item=>({...item,detail:item.relation+' · '+item.detail}))),
      el('p',report.note,'relationship-method'));
    card.append(practice);
    if (report.routine?.length) card.append(entries('4주 동안 함께 해볼 일',report.routine));
    const motif=window.TaekilReportGuide.dailyMotif({pair:report.people[0].hanja,theme:'relationship',heading:'h4'});
    if(motif)card.append(motif);
    card.append(evidence);
    const index=window.TaekilReportGuide.documentIndex([...card.querySelectorAll(':scope > section > h4')],{
      '잘 맞는 점':'두 사람이 편안함을 느끼는 행동과 그 이유를 읽어요.',
      '자주 엇갈릴 수 있는 상황':'같은 말이 다르게 들리는 순간을 살펴봐요.',
      '상황별로 읽는 두 사람의 관계':'연락과 약속 등 열두 장면을 두 사람의 입장에서 풀어요.',
      '실제로 써볼 대화':'먼저 건넬 말과 그다음에 함께 정할 일을 읽어요.',
      '4주 동안 함께 해볼 일':'한 주씩 두 사람이 실천해 볼 일을 정리해요.'
    });
    card.querySelector('.relationship-summary').after(index);
    return card;
  }

  example.addEventListener('toggle', async () => {
    if (!example.open || example.dataset.loaded) return;
    example.dataset.loaded='loading';
    const status=field('relationshipExampleStatus');
    status.textContent='가상 사주 예시를 불러오고 있어요.';
    try {
      const response=await fetch('/content/relationship-report-example.json');
      if (!response.ok) throw new Error('예시를 불러오지 못했어요.');
      const data=await response.json();
      status.textContent='가상의 두 사람에게 같은 계산 방식을 적용한 예시예요.';
      field('relationshipExampleBody').replaceChildren(reportCard(data));
      example.dataset.loaded='yes';
    } catch (_) {
      status.textContent='예시를 불러오지 못했어요. 접었다가 다시 열어 주세요.';
      delete example.dataset.loaded;
    }
  });

  window.TaekilReportGuide.openExampleWhenVisible(example);
  const formJump=el('button','두 사람 생년월일 입력하기','relationship-copy');
  formJump.type='button';
  formJump.addEventListener('click',()=>{
    const heading=form.querySelector('h2');
    heading.tabIndex=-1;
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start'});
  });
  example.before(formJump);

  function resetPreview() {
    comparison=null;
    review.querySelector('.report-coupon-use')?.remove();
    review.hidden=true;
    adminButton.remove();
    paymentCopy.hidden=false;
    output.replaceChildren();
    purchaseStatus.textContent='';
    formError.textContent='';
  }

  // Only the two day-cycle indices leave this form. Raw dates stay in the tab.
  function dayIndex({birth,calendar,leap}) {
    const parsed=window.TaekilDateEntry.parse(birth.value);
    if (!parsed) return null;
    const date=resolveBirthDate(parsed.iso,calendar.value,leap.checked);
    const korea=new Date(Date.now()+9*3600000);
    const year=korea.getUTCFullYear()-14, month=korea.getUTCMonth();
    const cutoff=new Date(year,month,Math.min(korea.getUTCDate(),new Date(year,month+1,0).getDate()));
    return !date || date > cutoff ? null : dayGanjiIndex(date);
  }

  for (const person of people) {
    person.calendar.addEventListener('change',() => {
      person.leap.closest('label').hidden = person.calendar.value !== 'lunar';
      if (person.calendar.value !== 'lunar') person.leap.checked=false;
    });
  }
  form.addEventListener('input',resetPreview);
  form.addEventListener('submit', event => {
    event.preventDefault();
    resetPreview();
    const [first,second]=people.map(dayIndex);
    if (first == null || second == null) {
      formError.textContent='두 분의 날짜와 양력·음력 선택을 다시 확인해 주세요. 만 14세 미만 아동의 정보는 사용할 수 없어요.';
      return;
    }
    comparison={first,second};
    window.TaekilCampaign?.activity('preview_relationship');
    field('relationshipPillars').textContent=`본인 ${ganjiFull(first)} · 상대방 ${ganjiFull(second)}`;
    const adminPreview=client.canPreviewAsAdmin();
    paymentCopy.hidden=adminPreview;
    if(adminPreview)paymentCopy.after(adminButton);
    else adminButton.remove();
    if(!adminPreview && accountStore.owner()){
      const selected=comparison;
      paymentCopy.after(window.TaekilReportCouponUse.control('taekilso_relationship_report',async(passId,token)=>{
        const current=()=>selected===comparison&&view.classList.contains('visible')&&accountStore.current(token);
        if(!current())return;
        const data=await client.request(endpoint,{operation:'coupon-open',passId,comparison:selected},token);
        if(!current())return;
        if(data.state!=='ready')throw Error('쿠폰으로 관계 리포트를 열지 못했어요. 내 기록을 확인해 주세요.');
        review.querySelector('.report-coupon-use')?.remove();
        displaySaved(data);
      }));
    }
    review.hidden=false;
    field('relationshipReviewTitle').focus({preventScroll:true});
    review.scrollIntoView({block:'nearest',behavior:'instant'});
  });

  function displaySaved(data) {
    output.replaceChildren(reportCard(data.report,data.expiresAtMs));
    output.scrollIntoView({block:'start',behavior:'instant'});
    purchaseStatus.textContent='내 기록에 저장된 리포트를 열었어요.';
  }

  adminButton.addEventListener('click',async()=>{
    const selected=comparison, token=accountStore.snapshot();
    const current=()=>selected===comparison&&view.classList.contains('visible')&&accountStore.current(token);
    if(!selected||!token.owner||!current()||adminButton.disabled)return;
    adminButton.disabled=true;
    try{
      const data=await client.request(endpoint,{operation:'admin-open',comparison:selected},token);
      if(!current())return;
      if(!data.adminPreview||data.state!=='ready')throw Error('관리자 리포트를 열지 못했어요.');
      displaySaved(data);
    }catch(error){if(current())purchaseStatus.textContent=error.message;}
    finally{adminButton.disabled=false;}
  });

  buyButton.addEventListener('click',async () => {
    window.TaekilCampaign?.activity('buy_relationship');
    const token=accountStore.snapshot();
    const selected=comparison;
    if (!selected || !view.classList.contains('visible') || !checkout.requireOpen()) return;
    if (!token.owner) {
      openAuthModal();
      purchaseStatus.textContent='로그인한 뒤 구매 버튼을 다시 눌러 주세요.';
      return;
    }
    try {
      await checkout.run(async () => {
        if (!await checkout.loadSdk() || comparison !== selected || !view.classList.contains('visible')) return false;
        const data=await client.request(endpoint,{operation:'prepare',comparison:selected,checkout:true,allowResume:true,expectedPrice:price},token);
        if (!accountStore.current(token) || comparison !== selected || !view.classList.contains('visible')) return false;
        if (data.state==='ready') {
          displaySaved(data);
        } else if (data.state==='resume') {
          client.showResume(purchaseStatus,data,pendingKey);
        } else if (data.state==='pending') {
          accountStore.setItem(pendingKey,data.id);
          purchaseStatus.textContent=client.pendingMessage(data);
        } else if (data.state==='paused') {
          purchaseStatus.textContent='신규 결제를 잠시 중단했어요.';
        }
        return client.pay(data,{price,name:'두 사람 관계 리포트',pendingKey,
          metricTopic:'relationship',returnFlag:'relationshipReport',memo:'두 사람의 일주 비교 리포트 1건'});
      });
    } catch (error) {
      if (accountStore.current(token)) purchaseStatus.textContent=error.message;
    }
  });

  function libraryItem({id,report,days,createdAtMs,expiresAtMs,adminPreview},open = false) {
    const row=el('details');
    const date=new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeZone:'Asia/Seoul'}).format(createdAtMs);
    const labels=days || report.people.map(person=>person.day);
    const summary=el('summary',date+' · '+labels.join(' · ')+(adminPreview?' · 관리자용':''));
    const expiry=client.libraryExpiry(expiresAtMs);
    if(expiry)summary.append(expiry);
    row.append(summary);
    const token=accountStore.snapshot();
    let busy=false;
    row.addEventListener('toggle',async function renderWhenOpened(){
      if (!row.open || busy) return;
      busy=true;
      const status=el('p','본문을 불러오고 있어요.');
      status.setAttribute('role','status');
      row.querySelector('[role="status"]')?.remove();
      row.append(status);
      try {
        const result=report ? {state:'ready',report,expiresAtMs,adminPreview} : await client.request(endpoint,{operation:'open',id},token);
        if(!row.isConnected || !accountStore.current(token)) return;
        if(result.state==='expired'){status.textContent=client.expiryMessage;return;}
        if(result.state!=='ready') throw new Error('현재 열람할 수 없는 리포트예요. 목록을 다시 확인해 주세요.');
        if(!result.adminPreview)window.TaekilCampaign?.activity('read_relationship');
        status.replaceWith(reportCard(result.report,result.expiresAtMs));
        row.removeEventListener('toggle',renderWhenOpened);
      } catch(error) {
        if(accountStore.current(token)) status.textContent=error.message+' 접었다가 다시 열면 재시도해요.';
      } finally {busy=false;}
    });
    row.open=open;
    return row;
  }

  async function loadLibrary(before = null) {
    const token=accountStore.snapshot();
    if (!token.owner) { openAuthModal(); return; }
    const version=++listVersion;
    const current=()=>accountStore.current(token)&&version===listVersion;
    libraryButton.disabled=true;
    libraryStatus.textContent='저장한 관계 리포트를 불러오고 있어요.';
    try {
      const pending=accountStore.getItem(pendingKey);
      const {reports,next}=await client.request(endpoint,{operation:'list',before,summaryOnly:true},token);
      if (!current()) return;
      const rows=reports.map(record=>libraryItem(record,record.id===pending));
      if (!before) library.replaceChildren();
      library.querySelector('.relationship-more')?.remove();
      library.append(...rows);
      if (next) {
        const more=el('button','이전 리포트 더 보기','btn relationship-more');
        more.type='button';
        more.addEventListener('click',async()=>{more.disabled=true; try {await loadLibrary(next);} finally {more.disabled=false;}});
        library.append(more);
      }
      libraryStatus.textContent=reports.length?'최근 발급한 리포트부터 볼 수 있어요.':'저장한 관계 리포트가 아직 없어요.';
      if (pending && !before) {
        if (reports.some(row=>row.id===pending)) {
          accountStore.removeItem(pendingKey);
          libraryStatus.textContent='관계 리포트를 내 기록에 저장했어요.';
        } else {
          const record=await client.request(endpoint,{operation:'open',id:pending,allowResume:true},token);
          if (!current()) return;
          if (record.state==='ready') library.prepend(libraryItem(record,true));
          if(record.state==='resume'){client.showResume(libraryStatus,record,pendingKey);return;}
          libraryStatus.textContent=record.state==='pending'?client.pendingMessage(record)
            :record.state==='ready'?'관계 리포트를 내 기록에 저장했어요.'
              :record.state==='expired'?client.expiryMessage:'이전 결제는 취소되었거나 환불됐어요.';
          if (record.state!=='pending') accountStore.removeItem(pendingKey);
        }
      }
    } catch (error) {
      if (current()) libraryStatus.textContent=error.message;
    } finally {
      if (current()) libraryButton.disabled=false;
    }
  }

  function finishCheckout() {
    const url=new URL(location.href);
    if (!accountStore.owner() || !url.searchParams.has('relationshipReport')) return;
    url.searchParams.delete('relationshipReport');
    history.replaceState(null,'',url);
    openReportHistory();
    void loadLibrary();
    field('relationshipLibraryTitle').scrollIntoView({block:'start',behavior:'instant'});
  }

  document.querySelector('.relationship-insight-link').addEventListener('click',event=>{
    event.preventDefault();
    closeSajuInsight();
    goTo('relationship-report');
  });
  libraryButton.addEventListener('click',()=>loadLibrary());
  window.addEventListener('DOMContentLoaded',finishCheckout,{once:true});
  window.addEventListener('taekilso:authChanged',() => {
    const next=accountStore.owner();
    if (next===owner) return;
    if (owner) {
      form.reset();
      people.forEach(person=>{person.leap.closest('label').hidden=true;});
      resetPreview();
    }
    owner=next;
    listVersion++;
    library.replaceChildren();
    libraryButton.disabled=false;
    libraryStatus.textContent='구매한 관계 리포트를 여기서 다시 읽을 수 있어요.';
    finishCheckout();
  });
})();
