(() => {
  const send = window.TaekilCampaign?.emitPreview;
  if (!send || !['taekilso.com', 'www.taekilso.com'].includes(location.hostname)) return;

  const key = 'taekilso_preview_funnel_v1';
  const windowMs = 30 * 60 * 1000;
  const fields = ['previewViews', 'previewStarts', 'previewSignups'];
  let journey = null;
  let sending = false;
  let retryCount = 0;
  let retryTimer = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (Number.isFinite(saved?.viewedAt) && saved.viewedAt <= Date.now() &&
        Number.isInteger(saved.stage) && saved.stage >= 1 && saved.stage <= fields.length &&
        Number.isInteger(saved.sent) && saved.sent >= 0 && saved.sent <= saved.stage) journey = saved;
  } catch (_) {}

  const withinWindow = () => journey && Date.now() - journey.viewedAt < windowMs;
  function persist() {
    try { sessionStorage.setItem(key, JSON.stringify(journey)); } catch (_) {}
  }
  async function flush() {
    if (sending || retryTimer || !withinWindow()) return;
    sending = true;
    try {
      while (withinWindow() && journey.sent < journey.stage) {
        const current = journey;
        const reason = await send(fields[current.sent]);
        if (current !== journey) continue;
        if (reason === 'RECORDED' || reason === 'DUPLICATE') {
          current.sent++;
          retryCount = 0;
          persist();
          continue;
        }
        if (reason) {
          current.sent = fields.length;
          current.stage = fields.length;
          persist();
        } else if (retryCount < 2) {
          retryCount++;
          retryTimer = setTimeout(() => { retryTimer = 0; flush(); }, retryCount * 2000);
        }
        return;
      }
    } finally { sending = false; }
  }
  function advance(stage) {
    if (stage === 1) {
      if (journey && (withinWindow() || getKstDateKey(new Date(journey.viewedAt)) === getKstDateKey())) return;
      journey = { viewedAt: Date.now(), stage: 1, sent: 0 };
    } else {
      if (!withinWindow() || journey.stage !== stage - 1) return;
      journey.stage = stage;
    }
    retryCount = 0;
    persist();
    flush();
  }

  window.TaekilPreviewFunnel = {
    consultationOpened(fromPreview) {
      if (fromPreview) advance(1);
      advance(2);
    }
  };
  window.addEventListener('taekilso:signupCreated', () => advance(3));
  if (journey?.stage === 2 && window.__lastSignupCreatedAt >= journey.viewedAt) advance(3);
  window.addEventListener('pageshow', flush);
  window.addEventListener('online', () => { retryCount = 0; flush(); });
  flush();

  const excerpt = document.querySelector('#homeDirectory .directory-preview-reading blockquote');
  if (!excerpt || !('IntersectionObserver' in window)) return;
  let visible = false;
  let dwellTimer = 0;
  function scheduleView() {
    clearTimeout(dwellTimer);
    if (visible && !document.hidden) {
      dwellTimer = setTimeout(() => {
        if (visible && !document.hidden) advance(1);
      }, 1000);
    }
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
    scheduleView();
  }, { threshold: 0.5 }).observe(excerpt);
  document.addEventListener('visibilitychange', scheduleView);
})();
