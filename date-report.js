(() => {
  'use strict';

  const endpoint = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/date-report';
  const pendingKey = 'taekilso_pending_date_report';
  const library = document.getElementById('dateReportList');
  const libraryStatus = document.getElementById('dateReportLibraryStatus');
  const libraryButton = document.getElementById('dateReportLoadLibrary');
  const checkout = window.TaekilCheckout;
  const client = window.TaekilAccountReport;
  const decision = window.TaekilReportDecision;
  const dateFormat = new Intl.DateTimeFormat('ko-KR',{dateStyle:'full',timeZone:'UTC'});
  let requestId = 0;
  let libraryOwner = accountStore.owner();

  function node(tag,text,className) {
    const element = document.createElement(tag);
    element.textContent = text || '';
    if (className) element.className = className;
    return element;
  }

  function dayLabel(day) {
    return dateFormat.format(new Date(day + 'T00:00:00Z'));
  }

  function action(text,handler,className = 'btn') {
    const button = node('button',text,className);
    button.type = 'button';
    button.addEventListener('click',handler);
    return button;
  }

  const request = (payload, token) => client.request(endpoint, payload, token);

  function reportCard({report,expiresAtMs}) {
    const box = node('article','','date-report-result');
    const title = node('h3',report.event + ' 후보일 정밀 비교');
    box.append(title);
    const expiry=client.expiryNote(expiresAtMs);
    if(expiry)box.append(expiry);
    box.append(decisionCard(report));
    const dates = node('ol','','date-report-ranked');
    let rank = 0;
    let previous;
    report.candidates.forEach((candidate,index) => {
      if (candidate.points !== previous) rank = index + 1;
      previous = candidate.points;
      const analysis=decision.dateReading(report.event,candidate);
      const row = node('li');
      const head=node('div','','date-report-day-head');
      head.append(node('strong',rank + '위 · ' + dayLabel(candidate.day)),
        node('span',candidate.points + '점','date-report-score'));
      const cues=node('ul','','date-report-cues');
      for(const person of analysis.people) cues.append(node('li',person.label+' '+person.relation));
      if(candidate.eventWeight) cues.append(node('li','일정 유형 가점'));
      if(candidate.folkWeight) cues.append(node('li','손없는 날'));
      const details=node('details','','date-report-day-basis');
      details.append(node('summary','이 날짜의 풀이와 계산 근거'));
      for(const person of analysis.people){
        details.append(node('p',person.label+' · '+person.interpretation));
      }
      details.append(node('p',analysis.eventNote), node('p',analysis.folkNote));
      const original=node('ul','','date-report-breakdown');
      const signed=value=>value>0?'+'+value:String(value);
      for(const person of analysis.people) original.append(node('li',person.label+' 오행 '+signed(person.weight)));
      original.append(node('li','일정 유형 '+signed(candidate.eventWeight)),node('li','민속 기준 '+signed(candidate.folkWeight)));
      details.append(original);
      if(analysis.action) details.append(node('p',analysis.action,'date-report-next-step'));
      row.append(head,node('p',`${candidate.ganji}(${candidate.hanja}) · ${candidate.element} 기운 · 음력 ${candidate.lunarDay}일`),cues,
        node('p',analysis.main,'date-report-day-reading'),details);
      dates.append(row);
    });
    box.append(node('h4','후보일별 풀이'),dates);
    const checklist = node('ul','','date-report-checklist');
    for (const entry of report.checklist) checklist.append(node('li',entry));
    box.append(node('h4','날짜를 확정하기 전에'),checklist,
      node('p','두 사람을 선택하면 각자의 기운 점수를 평균해요. 여기에 행사·민속 가점과 작은 순위 보정을 더해 100점으로 표시해요. '+report.note,'date-report-method'));
    return box;
  }

  function decisionCard(report) {
    const box = node('section','','date-report-decision');
    const [first,second]=report.candidates;
    if (!second) {
      box.append(node('p',report.summary));
      return box;
    }

    box.append(node('h4','가장 높은 후보와 비교하기'),node('p',report.summary));
    const controls=node('label','','date-report-compare-control');
    const select=node('select');
    for(const candidate of report.candidates.slice(1)){
      const option=node('option',dayLabel(candidate.day));
      option.value=candidate.day;
      select.append(option);
    }
    controls.append(node('span','비교할 후보일'),select);
    if(report.candidates.length>2)box.append(controls);
    const results=node('div','','date-report-compare-results');
    results.setAttribute('aria-live','polite');
    box.append(results);

    function update() {
      const alternative=report.candidates.find(candidate=>candidate.day===select.value) || second;
      const {factors,baseDifference,difference}=decision.dateComparison([first,alternative]);
      const score=node('p',`${dayLabel(first.day)} ${first.points}점 · ${dayLabel(alternative.day)} ${alternative.points}점`);
      const reason=node('p',difference===0
        ? '두 후보의 표시 점수가 같아요. 날짜를 확정하기 전에 실제 일정을 비교해 보세요.'
        : !factors.length
          ? `표시 점수 ${difference}점 차이예요. 오행·행사·손없는 날 반영값은 같고, 작은 순위 보정과 반올림에서 차이가 났어요.`
          : `표시 점수 ${difference}점 차이예요. 두 날짜에 다르게 반영된 기준을 아래에서 확인해 보세요.`);
      results.replaceChildren(score,reason);
      if(!factors.length)return;
      const list=node('ul','','date-report-factor-list');
      const weight=value=>value>0?'+'+value:String(value);
      for(const {label,firstWeight,secondWeight} of factors){
        list.append(node('li',label+' · 기준 후보 '+weight(firstWeight)+' / 비교 후보 '+weight(secondWeight)));
      }
      results.append(list,node('p','항목별 반영값은 100점으로 환산하기 전 수치예요.','date-report-method'));
      if(difference>0&&baseDifference<=0)results.append(node('p','세 기준의 합만 보면 기준 후보가 앞서지 않아요. 이 경우 표시 순위보다 실제 일정이 맞는 날을 먼저 살펴보세요.'));
    }
    select.addEventListener('change',update);
    update();
    return box;
  }

  function exampleDisclosure() {
    const detail = node('details','','date-report-example');
    const content = node('div');
    const status = node('p');
    status.setAttribute('role','status');
    detail.append(node('summary','가상의 후보 3개로 만든 정밀 택일 예시'),status,content);
    detail.addEventListener('toggle',async () => {
      if (!detail.open || detail.dataset.loaded) return;
      detail.dataset.loaded='loading';
      status.textContent='예시를 불러오고 있어요.';
      try {
        const res=await fetch('/content/date-report-example.json');
        if (!res.ok) throw new Error('EXAMPLE_UNAVAILABLE');
        content.replaceChildren(reportCard({report:await res.json()}));
        status.textContent='가상의 두 사람과 예식 후보일에 운영 계산식을 적용한 예시예요.';
        detail.dataset.loaded='yes';
      } catch (_) {
        status.textContent='예시를 불러오지 못했어요. 접었다가 다시 열어 주세요.';
        delete detail.dataset.loaded;
      }
    });
    return detail;
  }

  function offer(comparison) {
    const adminPreview=client.canPreviewAsAdmin();
    const card = node('section','','date-report-offer');
    card.append(node('span','후보일 '+comparison.days.length+'개','payment-eyebrow'),
      node('h3',adminPreview?'정밀 택일 · 관리자용':'정밀 택일 1건권 · 3,900원'),
      node('p','후보마다 본인·상대방의 오행 풀이, 순위가 갈린 이유와 일정 유형별 확인 사항을 확인해요.'),
      node('p',adminPreview?'결제 없이 정밀 비교를 열 수 있어요.':client.retentionNotice,'report-expiry-note'));
    const confirmation = node('ul','','date-report-selection');
    for (const day of comparison.days) confirmation.append(node('li',dayLabel(day)));
    card.append(confirmation);
    const status = node('p');
    status.setAttribute('role','status');
    const paused = node('p','신규 결제를 잠시 중단했어요. 정밀 택일이 포함된 기존 이용권 보유자는 아래에서 정밀 비교를 열 수 있어요.');
    paused.setAttribute('data-checkout-paused','');

    async function submit(purchase,asAdmin=false) {
      if (!card.isConnected || !card.closest('#view-tool.visible')) return false;
      const token = accountStore.snapshot();
      if (!token.owner) {
        openAuthModal();
        status.textContent = '로그인한 뒤 아래 버튼을 다시 눌러 주세요.';
        return false;
      }
      const data = await request(asAdmin?{operation:'admin-open',comparison}:
        {operation:'prepare',comparison,checkout:purchase,allowResume:true},token);
      if (!accountStore.current(token) || !card.isConnected || !card.closest('#view-tool.visible')) return false;
      if (data.state === 'ready') {
        if(!data.adminPreview)window.TaekilCampaign?.activity('read_date');
        card.replaceChildren(reportCard(data),node('p','내 기록에 저장했어요.'));
        return false;
      }
      if(asAdmin)throw Error('관리자 리포트를 열지 못했어요.');
      if (data.state === 'paused') {
        status.textContent = '신규 구매가 중단 중이에요. 무료 결과는 위에서 계속 볼 수 있어요.';
        return false;
      }
      if (data.state === 'available') {
        status.textContent = '이 후보들의 정밀 리포트를 한 건 구매할 수 있어요.';
        return false;
      }
      if (data.state === 'pending') {
        status.textContent = client.pendingMessage(data);
        accountStore.setItem(pendingKey,data.id);
        return false;
      }
      if(data.state==='resume') {
        client.showResume(status,data,pendingKey);
        return false;
      }
      return client.pay(data,{price:3900,name:'정밀 택일 1건권',pendingKey,
        metricTopic:'date',returnFlag:'dateReport',memo:'선택한 후보일 2~5개 정밀 비교 리포트 1건'});
    }

    const included = action(adminPreview?client.adminLabel:'기존 이용권으로 열기',async () => {
      if(included.disabled)return;
      included.disabled = true;
      try { await submit(false,adminPreview); }
      catch(error) { status.textContent = error.message; }
      finally { included.disabled = false; }
    });
    const buy = action('3,900원 · 정밀 비교 구매',async () => {
      window.TaekilCampaign?.activity('buy_date');
      if (!accountStore.owner()) { openAuthModal(); return; }
      try {
        await checkout.run(async () => await checkout.loadSdk() && await submit(true));
      } catch(error) { status.textContent = error.message; }
    },'btn btn-primary');
    buy.setAttribute('data-checkout-action','');
    window.TaekilCampaign?.activity('preview_date');
    if(!adminPreview)card.append(paused,checkout.statusNote());
    card.append(included);
    if(!adminPreview)card.append(buy);
    card.append(status,exampleDisclosure());
    return card;
  }

  function libraryItem(record,open = false) {
    const detail = node('details');
    detail.append(node('summary',record.report.event+' · '+dayLabel(record.report.candidates[0].day)+' 외 '+
      (record.report.candidates.length-1)+'개'+(record.adminPreview?' · 관리자용':'')),reportCard(record));
    detail.addEventListener('toggle',()=>{if(detail.open&&!record.adminPreview)window.TaekilCampaign?.activity('read_date');});
    detail.open = open;
    return detail;
  }

  async function loadLibrary(before = null) {
    const token = accountStore.snapshot();
    if (!token.owner) { openAuthModal(); return; }
    const current = ++requestId;
    libraryButton.disabled = true;
    libraryStatus.textContent = '저장한 택일 리포트를 불러오고 있어요.';
    try {
      const pending = accountStore.getItem(pendingKey);
      const {reports,next} = await request({operation:'list',before},token);
      if (!accountStore.current(token) || current !== requestId) return;
      const items = reports.map(record=>libraryItem(record,record.id===pending));
      if (before) {
        library.querySelector('.date-report-more')?.remove();
        library.append(...items);
      } else library.replaceChildren(...items);
      if (next) library.append(action('이전 리포트 더 보기',event=>{
        event.currentTarget.disabled = true;
        const button = event.currentTarget;
        void loadLibrary(next).finally(()=>{button.disabled=false;});
      },'btn date-report-more'));
      if (reports.some(record=>record.id===pending)) {
        accountStore.removeItem(pendingKey);
        libraryStatus.textContent = '정밀 택일 리포트를 내 기록에 저장했어요.';
      } else if (pending && !before) {
        const record = await request({operation:'open',id:pending,allowResume:true},token);
        if (!accountStore.current(token) || current !== requestId) return;
        if (record.state==='ready') library.prepend(libraryItem(record,true));
        if(record.state==='resume'){client.showResume(libraryStatus,record,pendingKey);return;}
        libraryStatus.textContent = record.state === 'pending'
          ? client.pendingMessage(record)
          : record.state === 'ready' ? '정밀 택일 리포트를 내 기록에 저장했어요.'
            : record.state === 'expired' ? client.expiryMessage : '이전 결제는 취소되었거나 환불됐어요.';
        if (record.state !== 'pending') accountStore.removeItem(pendingKey);
      } else {
        libraryStatus.textContent = reports.length ? '최근 저장 순서로 표시해요.' : '저장한 정밀 택일 리포트가 아직 없어요.';
      }
    } catch(error) {
      if (accountStore.current(token) && current === requestId) libraryStatus.textContent = error.message;
    } finally {
      if (current === requestId) libraryButton.disabled = false;
    }
  }

  libraryButton.addEventListener('click',()=>loadLibrary());
  window.addEventListener('taekilso:authChanged',() => {
    const owner = accountStore.owner();
    if (owner === libraryOwner) return;
    if (libraryOwner) {
      const comparison = document.querySelector('.tool-exact-results');
      if (comparison) {
        comparison.replaceChildren();
        comparison.hidden = true;
      }
    }
    libraryOwner = owner;
    requestId++;
    library.replaceChildren();
    libraryStatus.textContent = '구매하거나 저장한 후보일 비교를 여기서 다시 읽을 수 있어요.';
    libraryButton.disabled = false;
    if (owner) finishCheckout();
  });
  function finishCheckout() {
    const url = new URL(location.href);
    if (!url.searchParams.has('dateReport') || !accountStore.owner()) return;
    url.searchParams.delete('dateReport');
    history.replaceState(null,'',url);
    goTo('history');
    void loadLibrary();
    document.getElementById('dateReportLibraryTitle').scrollIntoView({block:'start',behavior:'instant'});
  }
  window.addEventListener('DOMContentLoaded',finishCheckout,{once:true});
  const planExample=document.querySelector('[data-date-report-example]');
  if (planExample) planExample.append(exampleDisclosure());
  window.TaekilDateReport = {offer};
})();
