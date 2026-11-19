(() => {
  const host = document.getElementById('aiConversationHistoryList');
  const controls = document.getElementById('aiHistoryFilters');
  const query = document.getElementById('aiHistoryQuery');
  const advisor = document.getElementById('aiHistoryAdvisor');
  const count = document.getElementById('aiHistoryFilterCount');
  const reset = document.getElementById('aiHistoryFilterReset');
  const noMatches = document.getElementById('aiHistoryNoMatches');
  if (!host || !controls) return;
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
  let owner = window.accountStore.owner();

  function filter() {
    const term = normalize(query.value);
    const total = host.children.length;
    const active = Boolean(term || advisor.value);
    let matches = 0;
    for (const row of host.children) {
      const title = normalize(row.querySelector('.ai-history-title').textContent);
      row.hidden = Boolean((advisor.value && row.dataset.historyAdvisor !== advisor.value) || !title.includes(term));
      if (!row.hidden) matches++;
    }
    controls.hidden = total === 0;
    reset.hidden = !active;
    noMatches.hidden = total === 0 || matches > 0;
    count.textContent = !total ? '' : active ? total + '개 중 ' + matches + '개 표시' : '상담 기록 ' + total + '개';
  }

  function refresh() {
    const selected = advisor.value;
    const ids = new Set(Array.from(host.children, row => row.dataset.historyAdvisor));
    if (selected) ids.add(selected);
    const people = Array.from(ids, id => window.TaekilConsultationPersonas.get(id));
    people.sort((a,b) => a.name.localeCompare(b.name, 'ko'));
    advisor.replaceChildren(new Option('전체 상담사', ''), ...people.map(person => new Option(person.name, person.id)));
    advisor.value = selected;
    filter();
  }

  function clear() {
    query.value = '';
    advisor.value = '';
    refresh();
  }

  query.addEventListener('input', filter);
  advisor.addEventListener('change', filter);
  reset.addEventListener('click', () => {
    clear();
    query.focus({preventScroll:true});
  });
  new MutationObserver(refresh).observe(host, {childList:true});
  window.addEventListener('taekilso:authChanged', () => {
    const next = window.accountStore.owner();
    if (next === owner) return;
    owner = next;
    clear();
  });
  refresh();
})();
