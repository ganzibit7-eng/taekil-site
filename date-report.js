(() => {
  'use strict';

  const endpoint = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/date-report';
  const pendingKey = 'taekilso_pending_date_report';
  const library = document.getElementById('dateReportList');
  const libraryStatus = document.getElementById('dateReportLibraryStatus');
  const libraryButton = document.getElementById('dateReportLoadLibrary');
  const checkout = window.TaekilCheckout;
  const client = window.TaekilAccountReport;
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

  function reportCard({report}) {
    const box = node('article','','date-report-result');
    const title = node('h3',report.event + ' 후보일 정밀 비교');
    box.append(title,node('p',report.summary));
    const dates = node('ol','','date-report-ranked');
    let rank = 0;
    let previous;
    report.candidates.forEach((candidate,index) => {
      if (candidate.points !== previous) rank = index + 1;
      previous = candidate.points;
      const row = node('li');
      row.append(node('strong',rank + '위 · ' + dayLabel(candidate.day)),
        node('span',candidate.points + '점','date-report-score'),
        node('p',`${candidate.ganji}(${candidate.hanja}) · ${candidate.element} 기운 · 음력 ${candidate.lunarDay}일`));
      const scores = node('ul','','date-report-breakdown');
      for (const person of candidate.people) {
        scores.append(node('li',`${person.label} · ${person.relation} (${person.weight>0?'+':''}${person.weight})`));
      }
      scores.append(node('li','행사 기준 '+(candidate.eventWeight ? '+1.5' : '가점 없음')),
        node('li',candidate.folkWeight ? '손없는 날 +'+candidate.folkWeight : '손없는 날 가점 없음'));
      row.append(scores);
      if (candidate.people.some(person=>person.weight<0)) {
        row.append(node('p','상극 항목이 있어요. 비슷한 점수의 후보가 있다면 이동이나 준비 여건이 더 안정적인 날도 살펴보세요.'));
      }
      dates.append(row);
    });
    const checklist = node('ul','','date-report-checklist');
    for (const entry of report.checklist) checklist.append(node('li',entry));
    box.append(dates,node('h4','날짜를 확정하기 전에'),checklist,
      node('p','두 사람을 선택하면 각자의 기운 점수를 평균해요. 여기에 행사·민속 가점과 작은 순위 보정을 더해 100점으로 표시해요. '+report.note,'date-report-method'));
    return box;
  }

  function offer(comparison) {
    const card = node('section','','date-report-offer');
    card.append(node('span','후보일 '+comparison.days.length+'개','payment-eyebrow'),
      node('h3','정밀 택일 1건권 · 3,900원'),
      node('p','선택한 날짜 전체의 순위와 날짜별 점수 근거, 확정 전 체크리스트를 내 기록에 보관해요.'));
    const confirmation = node('ul','','date-report-selection');
    for (const day of comparison.days) confirmation.append(node('li',dayLabel(day)));
    card.append(confirmation);
    const status = node('p');
    status.setAttribute('role','status');
    const paused = node('p','신규 결제를 잠시 중단했어요. 기존 신년상담 이용자는 아래에서 정밀 비교를 열 수 있어요.');
    paused.setAttribute('data-checkout-paused','');

    async function submit(purchase) {
      const token = accountStore.snapshot();
      if (!token.owner) {
        openAuthModal();
        status.textContent = '로그인한 뒤 아래 버튼을 다시 눌러 주세요.';
        return false;
      }
      const data = await request({operation:'prepare',comparison,checkout:purchase},token);
      if (!accountStore.current(token) || !card.isConnected) return false;
      if (data.state === 'ready') {
        card.replaceChildren(reportCard(data),node('p','내 기록에 저장했어요.'));
        return false;
      }
      if (data.state === 'paused') {
        status.textContent = '신규 구매가 중단 중이에요. 무료 결과는 위에서 계속 볼 수 있어요.';
        return false;
      }
      if (data.state === 'available') {
        status.textContent = '이 후보들의 정밀 리포트를 한 건 구매할 수 있어요.';
        return false;
      }
      if (data.state === 'pending') {
        status.textContent = '같은 후보일의 결제를 확인 중이에요. 새로 결제하기 전에 내 기록에서 확인해 주세요.';
        accountStore.setItem(pendingKey,data.id);
        return false;
      }
      return client.pay(data,{price:3900,name:'정밀 택일 1건권',pendingKey,
        returnFlag:'dateReport',memo:'선택한 후보일 2~5개 정밀 비교 리포트 1건'});
    }

    const included = action('기존 이용권으로 열기',async () => {
      included.disabled = true;
      try { await submit(false); }
      catch(error) { status.textContent = error.message; }
      finally { included.disabled = false; }
    });
    const buy = action('3,900원 · 정밀 비교 구매',async () => {
      if (!accountStore.owner()) { openAuthModal(); return; }
      try {
        await checkout.run(async () => await checkout.loadSdk() && await submit(true));
      } catch(error) { status.textContent = error.message; }
    },'btn btn-primary');
    buy.setAttribute('data-checkout-action','');
    card.append(paused,included,buy,status);
    return card;
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
      const items = reports.map(record => {
        const detail = node('details');
        detail.append(node('summary',record.report.event+' · '+dayLabel(record.report.candidates[0].day)+' 외 '+(record.report.candidates.length-1)+'개'),reportCard(record));
        if (record.id === pending) detail.open = true;
        return detail;
      });
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
      } else if (pending) {
        const {state} = await request({operation:'open',id:pending},token);
        if (!accountStore.current(token) || current !== requestId) return;
        libraryStatus.textContent = state === 'pending'
          ? '결제 확인 전이에요. 완료한 뒤 잠시 기다렸다가 다시 확인해 주세요.'
          : state === 'ready' ? '다시 확인하면 최신 리포트가 표시돼요.' : '이전 결제는 취소되었거나 환불됐어요.';
        if (state !== 'pending' && state !== 'ready') accountStore.removeItem(pendingKey);
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
  window.TaekilDateReport = {offer};
})();
