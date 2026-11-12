/* Temporary, tab-scoped onboarding drafts. Never an authentication credential. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TaekilConsultationDraft = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const ttl = 30 * 60 * 1000;
  const fields = ['ProfileName','Relation','Gender','CalType','Year','Month','Day','Hour'];
  function birth(raw) {
    const digits = String(raw || '').replace(/\D/g,'').slice(0,8);
    const text = [digits.slice(0,4),digits.slice(4,6),digits.slice(6,8)].filter(Boolean).join('.');
    return {text, complete:digits.length === 8, y:digits.length >= 4 ? digits.slice(0,4) : '',
      m:digits.length >= 6 ? String(Number(digits.slice(4,6))) : '', d:digits.length === 8 ? String(Number(digits.slice(6,8))) : ''};
  }
  function read(raw, now, owner) {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.version !== 1 || !Number.isFinite(data.at) || now < data.at || now - data.at > ttl) return null;
      if (data.owner && data.owner !== owner) return null;
      // A guest draft crosses into an account only after an explicit sign-in request.
      if (!data.owner && owner && !data.awaitingAuth) return null;
      if (!data.values || typeof data.values !== 'object') return null;
      const values = {};
      fields.forEach(key => { values[key] = String(data.values[key] ?? '').slice(0, key === 'ProfileName' ? 20 : 40); });
      return {version:1,at:data.at,owner:String(data.owner || ''),awaitingAuth:data.awaitingAuth === true,
        step:Math.min(5,Math.max(0,Number.isInteger(data.step) ? data.step : 0)),values,
        leap:data.leap === true,question:String(data.question || '').slice(0,200),birthText:birth(data.birthText).text,
        selections: Object.fromEntries(['SavedProfile','CompareProfile','CompareProfile2'].map(key => [key, data.owner ? String(data.selections?.[key] || '').slice(0,100) : '']))};
    } catch (_) { return null; }
  }
  return {read, fields, ttl, birth};
});
