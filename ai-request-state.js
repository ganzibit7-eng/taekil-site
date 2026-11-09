(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else {
    let storage;
    try { storage = root.sessionStorage; } catch (_) {}
    root.yeonwooRequests = factory(storage, () => root.crypto.randomUUID());
  }
})(typeof window === 'undefined' ? globalThis : window, function (storage, randomId) {
  const key = 'taekilso_pending_ai_request_v1';
  let pending;
  try { pending = JSON.parse(storage.getItem(key) || 'null'); } catch (_) {}
  return {
    begin(context, payload) {
      if (pending && pending.context === context && pending.message === payload.message && typeof pending.body === 'string') return pending.body;
      pending = { context, message: payload.message, requestId: randomId() };
      pending.body = JSON.stringify({ ...payload, requestId: pending.requestId });
      try { storage.setItem(key, JSON.stringify(pending)); } catch (_) {}
      return pending.body;
    },
    clear() {
      pending = null;
      try { storage.removeItem(key); } catch (_) {}
    }
  };
});
