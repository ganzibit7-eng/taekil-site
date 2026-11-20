(() => {
  'use strict';
  const field = id => document.getElementById(id);
  const endpoint = 'https://taekilso-api-jhqz3vlila-du.a.run.app/api/relationship-report';
  const checkout = window.TaekilCheckout;
  const client = window.TaekilAccountReport;
  const pendingKey = 'taekilso_pending_relationship_report';
  const form = field('relationshipReportForm');
  const review = field('relationshipReview');
  const output = field('relationshipReportOutput');
  const formError = field('relationshipFormError');
  const purchaseStatus = field('relationshipPurchaseStatus');
  const example = field('relationshipExample');
  const library = field('relationshipLibraryList');
  const libraryStatus = field('relationshipLibraryStatus');
  const libraryButton = field('relationshipLoadLibrary');
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

  function reportCard(report) {
    const card = el('article','','relationship-reading');
    card.append(el('h3','두 사람 관계 리포트'),el('p',report.summary,'relationship-summary'),
      el('p','본인 '+label(report.people[0])+' · 상대방 '+label(report.people[1]),'relationship-pillars'));
    card.append(entries('잘 맞는 점',report.strengths),entries('자주 엇갈릴 수 있는 상황',report.friction));
    const practice = el('section');
    practice.append(el('h4','실제로 써볼 대화'));
    report.conversations.forEach(conversation => {
      const scene = el('div','','relationship-dialogue');
      scene.append(el('h5',conversation.title));
      for(const [speaker,line] of [['본인',conversation.first],['상대방',conversation.second]]) {
        const quote = el('blockquote');
        quote.append(el('b',speaker),el('p',line));
        scene.append(quote);
      }
      practice.append(scene);
    });
    practice.append(el('p',report.nextStep,'relationship-next-step'));
    const evidence = el('details');
    evidence.append(el('summary','풀이에 사용한 계산 근거'),
      entries('두 사람의 오행 비교',report.evidence.map(item=>({...item,detail:item.relation+' · '+item.detail}))),
      el('p',report.note,'relationship-method'));
    card.append(practice,evidence);
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

  function resetPreview() {
    comparison=null;
    review.hidden=true;
    output.replaceChildren();
    purchaseStatus.textContent='';
    formError.textContent='';
  }

  // Only the two day-cycle indices leave this form. Raw dates stay in the tab.
  function dayIndex({birth,calendar,leap}) {
    const date=resolveBirthDate(birth.value,calendar.value,leap.checked);
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
    field('relationshipPillars').textContent=`본인 ${ganjiFull(first)} · 상대방 ${ganjiFull(second)}`;
    review.hidden=false;
    field('relationshipReviewTitle').focus({preventScroll:true});
    review.scrollIntoView({block:'nearest',behavior:'instant'});
  });

  field('buyRelationshipReport').addEventListener('click',async () => {
    const token=accountStore.snapshot();
    const selected=comparison;
    if (!selected || !checkout.requireOpen()) return;
    if (!token.owner) {
      openAuthModal();
      purchaseStatus.textContent='로그인한 뒤 구매 버튼을 다시 눌러 주세요.';
      return;
    }
    try {
      await checkout.run(async () => {
        if (!await checkout.loadSdk() || comparison !== selected) return false;
        const data=await client.request(endpoint,{operation:'prepare',comparison:selected,checkout:true},token);
        if (!accountStore.current(token) || comparison !== selected) return false;
        if (data.state==='ready') {
          output.replaceChildren(reportCard(data.report));
          output.scrollIntoView({block:'start',behavior:'instant'});
          purchaseStatus.textContent='내 기록에 저장된 리포트를 열었어요.';
        } else if (data.state==='pending') {
          accountStore.setItem(pendingKey,data.id);
          purchaseStatus.textContent='이 리포트의 결제를 확인 중이에요. 내 기록에서 확인해 주세요.';
        } else if (data.state==='paused') {
          purchaseStatus.textContent='신규 결제를 잠시 중단했어요.';
        }
        return client.pay(data,{price:5900,name:'두 사람 관계 리포트',pendingKey,
          returnFlag:'relationshipReport',memo:'두 사람의 일주 비교 리포트 1건'});
      });
    } catch (error) {
      if (accountStore.current(token)) purchaseStatus.textContent=error.message;
    }
  });

  async function loadLibrary(before = null) {
    const token=accountStore.snapshot();
    if (!token.owner) { openAuthModal(); return; }
    const version=++listVersion;
    const current=()=>accountStore.current(token)&&version===listVersion;
    libraryButton.disabled=true;
    libraryStatus.textContent='저장한 관계 리포트를 불러오고 있어요.';
    try {
      const pending=accountStore.getItem(pendingKey);
      const {reports,next}=await client.request(endpoint,{operation:'list',before},token);
      if (!current()) return;
      const rows=reports.map(({id,report,createdAtMs})=>{
        const row=el('details');
        const date=new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeZone:'Asia/Seoul'}).format(createdAtMs);
        row.append(el('summary',date+' · '+report.people[0].day+'과 '+report.people[1].day),reportCard(report));
        row.open=id===pending;
        return row;
      });
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
          const {state}=await client.request(endpoint,{operation:'open',id:pending},token);
          if (!current()) return;
          libraryStatus.textContent=state==='pending'?'결제를 확인하고 있어요. 잠시 후 다시 확인해 주세요.'
            :state==='ready'?'다시 확인하면 새 리포트가 표시돼요.':'이전 결제는 취소되었거나 환불됐어요.';
          if (state!=='pending' && state!=='ready') accountStore.removeItem(pendingKey);
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
    goTo('history');
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
