(() => {
  const send = window.TaekilCampaign?.activity;
  if (!send || !['taekilso.com', 'www.taekilso.com'].includes(location.hostname)) return;

  let viewed = false;
  function readExample() {
    if (viewed || !window.TaekilMetricsPreference?.enabled()) return;
    viewed = true;
    send('exampleReads');
  }
  window.TaekilPreviewFunnel = {
    consultationOpened() { send('consultationOpens'); }
  };
  const excerpts = document.querySelectorAll('#homeDirectory .directory-preview-reading blockquote');
  if (!excerpts.length || !('IntersectionObserver' in window)) return;
  const visibleExcerpts = new Set();
  const visible = () => Array.from(visibleExcerpts).find(excerpt => !excerpt.closest('[hidden]'));
  let dwellTimer = 0;
  function scheduleView() {
    clearTimeout(dwellTimer);
    const excerpt = visible();
    if (excerpt && !document.hidden) {
      dwellTimer = setTimeout(() => {
        if (visible() === excerpt && !document.hidden) readExample();
      }, 1000);
    }
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) visibleExcerpts.add(entry.target);
      else visibleExcerpts.delete(entry.target);
    }
    scheduleView();
  }, { threshold: 0.5 });
  for (const excerpt of excerpts) observer.observe(excerpt);
  document.addEventListener('visibilitychange', scheduleView);
})();
