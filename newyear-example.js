/* A recorded report from a synthetic profile, served as public static content. */
(() => {
  'use strict';
  const view = document.getElementById('view-newyear');
  if (!view) return;

  const make = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const paragraphs = (element, text) => {
    for (const part of text.trim().split(/\n{2,}/)) element.append(make('p', part));
  };

  const section = make('section', null, 'newyear-example');
  const details = make('details');
  const summary = make('summary', '7월 실제 풀이 읽기');
  const body = make('div', null, 'newyear-example-body');
  const heading = make('header', null, 'newyear-example-heading');
  const intro = make('div');
  intro.append(
    make('h2', '신년 리포트 한 달 미리보기'),
    make('p', '1990년 1월 1일 양력 · 출생시간·성별 미상인 가상 사주로 받은 실제 리포트 일부예요.', 'newyear-example-intro')
  );
  heading.append(intro);
  const dawn = document.getElementById('newyearExampleDawn');
  if (dawn) {
    heading.append(dawn);
    dawn.hidden = false;
  }
  details.append(summary, body);
  const scope=make('section',null,'newyear-preview-scope');
  scope.append(make('h3','전체 리포트 목차'));
  const contentsList=make('dl');
  for(const [title,copy] of [
    ['나의 원국과 한 해의 흐름','태어난 날의 기운에 2027년 정미년이 더해지면 무엇이 달라지는지 읽어요.'],
    ['일·재물·관계·생활','한 해의 변화가 일하는 방식, 돈의 쓰임, 가까운 사람과의 관계에 어떻게 드러나는지 살펴봐요.'],
    ['1월부터 12월까지','달마다 눈여겨볼 변화와 그 이유를 읽어요. 아래에서 가상 사주의 7월 풀이를 무료로 볼 수 있어요.'],
    ['기회와 주의할 점','활용하기 좋은 기회와 한 번 더 짚어야 할 선택을 연우의 마무리 풀이까지 이어 읽어요.']
  ])contentsList.append(make('dt',title),make('dd',copy));
  scope.append(contentsList);
  section.append(heading,scope,window.TaekilPaidPageSample('newyear'),details);
  view.querySelector('.newyear-value').before(section);
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-newyear-preview]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goTo('newyear');
    requestAnimationFrame(() => {
      const target = section.hidden ? view.querySelector('.newyear-account') : summary;
      if (!section.hidden) details.open = true;
      target.focus({preventScroll:true});
      target.scrollIntoView({block:'start',behavior:'instant'});
    });
  });

  const updateVisibility = () => { section.hidden = view.classList.contains('has-report'); };
  new MutationObserver(updateVisibility).observe(view,{attributes:true,attributeFilter:['class']});
  updateVisibility();
  window.TaekilReportGuide.openExampleWhenVisible(details);

  let loaded = false;
  let loading = false;
  details.addEventListener('toggle', async () => {
    if (!details.open || loaded || loading) return;
    loading = true;
    body.setAttribute('aria-busy','true');
    body.replaceChildren(make('p', '예시 리포트를 불러오고 있어요.'));
    try {
      const response = await fetch('/content/newyear-example-1990.json?v=20261119-one-month');
      if (!response.ok) throw Error('EXAMPLE_UNAVAILABLE');
      const {report} = await response.json();
      const overview = make('section', null, 'newyear-report-section');
      overview.append(make('h3','한 해의 큰 흐름'));
      paragraphs(overview, report.overview);

      const contents = make('section', null, 'newyear-example-contents');
      const months = make('ol', null, 'newyear-example-index');
      for (const month of report.months) {
        const row = make('li');
        row.append(make('strong',month.month+'월'), make('span',month.theme));
        months.append(row);
      }
      contents.append(make('h3','월별 풀이 목차'), months);

      const featured = make('section', null, 'newyear-report-section');
      const month = report.featured;
      featured.append(make('h3',month.month+'월 · '+month.theme));
      paragraphs(featured, month.reading);
      featured.append(make('p',month.action,'newyear-action'));
      const basis = make('details', null, 'newyear-calculation-note');
      basis.append(make('summary','이 풀이의 계산 근거'));
      paragraphs(basis, month.calculationNote);
      featured.append(basis);

      const ask = make('button', '이 주제로 연우에게 묻기', 'directory-preview-action');
      ask.type = 'button';
      ask.setAttribute('data-home-consultation','');
      ask.dataset.openExampleQuestion = '함께 여행이나 모임을 준비할 때 돈과 시간을 나누는 게 고민이에요. 제 사주를 바탕으로 어떤 기준으로 상의하면 좋을까요?';
      body.replaceChildren(overview,contents,featured,ask);
      window.TaekilCampaign?.activity('preview_newyear');
      loaded = true;
    } catch (_) {
      body.replaceChildren(make('p','예시를 불러오지 못했어요. 닫았다가 다시 열어 주세요.'));
    } finally {
      loading = false;
      body.removeAttribute('aria-busy');
    }
  });
})();
