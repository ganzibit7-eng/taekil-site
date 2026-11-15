(() => {
  const view = document.getElementById('view-tool');
  const form = document.getElementById('toolFormAnchor');
  if (!view || !form) return;

  const modeGroup = form.querySelector('.tool-date-mode');
  const modes = [...modeGroup.querySelectorAll('[data-date-mode]')];
  const dates = form.querySelector('.tool-exact-dates');
  const output = form.querySelector('.tool-exact-output');
  const error = output.querySelector('.tool-exact-error');
  const results = output.querySelector('.tool-exact-results');
  const title = dates.querySelector('h2');
  const dateFields = ['exactDateFirst', 'exactDateSecond'].map(id => document.getElementById(id));
  const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' });
  const field = id => document.getElementById(id);
  const eventType = () => form.querySelector('.event-opt.active').dataset.val;

  function resetComparison() {
    error.textContent = '';
    dateFields.forEach(input => input.removeAttribute('aria-invalid'));
    results.hidden = true;
  }

  function setMode(mode) {
    const comparing = mode === 'exact';
    view.dataset.comparisonMode = mode;
    modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.dateMode === mode)));
    dates.hidden = !comparing;
    output.hidden = !comparing;
    if (comparing) title.textContent = eventType() === '결혼식' ? '예식 후보일 비교' : eventType() + ' 후보일 비교';
    resetComparison();
  }

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(value + 'T00:00:00');
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  function birthElement(prefix) {
    const scope = prefix === 'birth' ? 'birth' : 'partner';
    const date = resolveBirthDate(field(prefix + 'Date').value, getCalType(scope + 'CalType'), field(scope + 'Leap').checked);
    return date ? ohaengOf(dayGanjiIndex(date)) : null;
  }

  function stop(text, input) {
    error.textContent = text;
    input?.focus();
  }

  function item(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function render(candidates, withPartner) {
    const heading = item('h2', '후보일 비교 결과');
    heading.id = 'toolExactResultTitle';
    heading.tabIndex = -1;
    const points = candidates.map(candidate => to100(candidate.score));
    const [first, second] = points;
    const summary = first === second
      ? '두 후보의 표시 점수가 같아요.'
      : `${first > second ? '첫 번째' : '두 번째'} 후보일이 택일 기준에서 ${Math.abs(first - second)}점 높아요.`;
    const cards = item('div', '', 'tool-exact-cards');
    candidates.forEach((candidate, index) => {
      const card = item('article', '', 'tool-exact-card');
      const caption = item('h3', dateFormat.format(candidate.date));
      const score = item('strong', points[index] + '점', 'tool-exact-score');
      const reasons = item('ul');
      for (const reason of candidate.reasons) reasons.append(item('li', reason));
      if (!candidate.reasons.length) reasons.append(item('li', '기본 비교 기준에서 두드러지는 항목이 없어요.'));
      if (!candidate.lunarInfo) reasons.append(item('li', '음력 달력 정보를 확인할 수 없어 손없는 날 가점은 빠졌어요.'));
      card.append(caption, score, item('p', `${candidate.ganji}(${candidate.ganjiHanja}) · ${candidate.ohaeng} 기운`), reasons);
      cards.append(card);
    });
    const practical = eventType() === '결혼식'
      ? '예식장 예약과 하객 일정도 함께 살펴보세요.' : '실제로 가능한 시간과 준비 일정도 함께 살펴보세요.';
    results.replaceChildren(
      heading,
      item('p', withPartner ? '두 사람의 생년월일을 함께 반영했어요.' : '입력한 한 분의 생년월일을 반영했어요.'),
      cards,
      item('p', summary + ' ' + practical, 'tool-exact-note')
    );
    results.hidden = false;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  field('compareExactDates').addEventListener('click', () => {
    resetComparison();
    const selected = dateFields.map(input => parseDate(input.value));
    const invalid = selected.indexOf(null);
    if (invalid !== -1) {
      dateFields[invalid].setAttribute('aria-invalid', 'true');
      return stop('비교할 후보일 두 개를 모두 입력해 주세요.', dateFields[invalid]);
    }
    if (+selected[0] === +selected[1]) {
      dateFields[1].setAttribute('aria-invalid', 'true');
      return stop('서로 다른 날짜를 골라 주세요.', dateFields[1]);
    }
    const mine = birthElement('birth');
    if (!mine) return stop('본인의 생년월일을 확인해 주세요.', field('birthYear'));
    const withPartner = field('coupleToggle').checked;
    const partner = withPartner ? birthElement('partnerBirth') : null;
    if (withPartner && !partner) return stop('상대방 생년월일을 확인해 주세요.', field('partnerYear'));
    render(selected.map(date => buildTaekilCandidate(date, eventType(), mine, partner)), withPartner);
  });

  modes.forEach(button => button.addEventListener('click', () => {
    setMode(button.dataset.dateMode);
    modeGroup.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }));
  form.addEventListener('change', () => {
    if (view.dataset.comparisonMode === 'exact') resetComparison();
  });
  form.addEventListener('click', event => {
    if (view.dataset.comparisonMode === 'exact' && event.target.closest('.ct-btn')) resetComparison();
  });
  document.querySelectorAll('[data-open-date-comparison]').forEach(link => link.addEventListener('click', () => {
    setMode('exact');
    title.focus({ preventScroll: true });
  }));
  new MutationObserver(() => {
    if (!view.classList.contains('visible') && view.dataset.comparisonMode === 'exact') setMode('range');
  }).observe(view, { attributes: true, attributeFilter: ['class'] });
})();
