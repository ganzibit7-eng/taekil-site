/* Successful production generations measured 2026-11-26. Rounded display estimates;
   small samples are estimates, not a delivery guarantee. */
(() => {
  const meanSeconds = {dogyeom:41,seohwa:35,ijun:31,mujin:34,newyear:70};
  function estimate(type, elapsedMs) {
    const mean = meanSeconds[type];
    const seconds = Math.max(0, elapsedMs / 1000);
    const ratio = seconds / mean;
    const percent = Math.min(99, Math.floor(ratio <= 1 ? ratio * 90 : 90 + 10 * (1 - Math.exp(1 - ratio))));
    const rounded = Math.round(mean / 5) * 5;
    const text = ratio > 1.3 ? '평소보다 시간이 더 걸리고 있어요. 완성되면 바로 열려요.' : '예상 소요 시간 약 ' + rounded + '초';
    return {percent,text};
  }
  window.TaekilWriteEstimate = estimate;
})();
