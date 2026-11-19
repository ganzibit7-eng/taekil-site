(() => {
  const notice = document.getElementById('startupRecovery');
  const retry = document.getElementById('startupRetry');
  let initialized = false;
  let routed = false;
  function show() {
    if (!notice.hidden) return;
    notice.hidden = false;
    retry.focus({preventScroll: true});
  }
  retry.addEventListener('click', () => location.reload());
  const timer = setTimeout(show, 15000);
  function ready() {
    if (!initialized || !routed) return;
    clearTimeout(timer);
    notice.hidden = true;
    window.removeEventListener('error', startupError);
  }
  function startupError(event) {
    if (event instanceof ErrorEvent && (!event.filename || event.filename === location.href.split('#')[0])) show();
  }
  window.addEventListener('error', startupError);
  window.TaekilStartup = {
    initialized() { initialized = true; ready(); },
    routed() { routed = true; ready(); }
  };
})();
