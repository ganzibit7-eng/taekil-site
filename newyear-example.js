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
  details.append(summary, body);
  section.append(
    make('h2', '신년 리포트 한 달 미리보기'),
    make('p', '1990년 1월 1일 양력 · 출생시간·성별 미상인 가상 사주로 받은 실제 리포트 일부예요.', 'newyear-example-intro'),
    details
  );
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

      const contents = make('details', null, 'newyear-example-contents');
      const months = make('ol', null, 'newyear-example-index');
      for (const month of report.months) {
        const row = make('li');
        row.append(make('strong',month.month+'월'), make('span',month.theme));
        months.append(row);
      }
      contents.append(make('summary','12개월 목차 보기'), months);

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
      loaded = true;
    } catch (_) {
      body.replaceChildren(make('p','예시를 불러오지 못했어요. 닫았다가 다시 열어 주세요.'));
    } finally {
      loading = false;
      body.removeAttribute('aria-busy');
    }
  });
})();
