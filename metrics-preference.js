(() => {
  'use strict';
  const key = 'taekilso_metrics_disabled_v1';
  const button = document.getElementById('metricsPreferenceButton');
  const status = document.getElementById('metricsPreferenceStatus');
  let unavailable = false;
  function enabled() {
    if (unavailable) return false;
    try { return localStorage.getItem(key) !== '1'; }
    catch (_) { unavailable = true; return false; }
  }
  function clearStats(storage, keys, prefixes) {
    for (const name of Object.keys(storage)) {
      if (keys.includes(name) || prefixes.some(prefix => name.startsWith(prefix))) storage.removeItem(name);
    }
  }
  function refresh() {
    const active = enabled();
    if (!active) {
      try {
        clearStats(localStorage, ['taekilso_campaign_v1','taekilso_seo_attribution_v1','taekilso_ai_funnel_v1'], ['seo_conv_']);
        clearStats(sessionStorage, ['taekilso_preview_funnel_v1','taekilso_report_events_v1','taekilso_metrics_session_v1'], ['taekilso_seo_session_']);
      } catch (_) { /* Restricted storage already prevents persistent identifiers. */ }
    }
    if (!button || !status) return;
    button.textContent = active ? '통계 수집 거부하기' : '통계 수집 다시 허용하기';
    button.disabled = unavailable;
    status.textContent = unavailable ? '설정을 저장할 수 없어 통계 수집을 중지했습니다.' :
      (active ? '현재 이 브라우저에서 수집 중' : '현재 이 브라우저에서 수집 거부');
  }
  button?.addEventListener('click', () => {
    try { localStorage.setItem(key, enabled() ? '1' : '0'); }
    catch (_) { unavailable = true; }
    refresh();
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) refresh(); });
  window.TaekilMetricsPreference = {enabled};
  refresh();
})();
