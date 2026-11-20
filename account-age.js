(() => {
  'use strict';
  const checkbox = document.getElementById('authAgeConfirmed');
  const modeButtons = document.querySelectorAll('[data-auth-mode]');
  const actions = document.querySelectorAll('#authOverlay button[data-provider]');
  const ageRow = checkbox.closest('label');
  const hintKey = 'taekilso_returning_member';
  const redirectKey = 'taekilso_age_redirect';
  let mode, verifiedUid, lookup, connection, approvedUid;
  const uidNow = () => window.firebase?.auth()?.currentUser?.uid;
  function sync() {
    for (const button of actions) button.disabled = !!connection || (mode === 'signup' && !checkbox.checked);
  }
  function select(next) {
    mode = next;
    checkbox.checked = false;
    ageRow.hidden = mode !== 'signup';
    for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.authMode === next));
    document.getElementById('authTitle').textContent = next === 'signup' ? '택일소 회원가입' : '택일소 로그인';
    document.getElementById('authError').style.display = 'none';
    sync();
  }
  function open() {
    let returning = false;
    try { returning = localStorage.getItem(hintKey) === '1'; } catch {}
    select(returning ? 'login' : 'signup');
  }
  for (const b of modeButtons) b.onclick = () => { if (!connection) select(b.dataset.authMode); };
  checkbox.onchange = sync;
  open();
  function entry() {
    if (connection) return null;
    if (mode === 'signup' && !checkbox.checked) { checkbox.focus(); return null; }
    return mode;
  }
  // A pre-login check belongs to the credential returned by this single provider operation.
  async function connect(operation, intent) {
    if (connection) throw Error('이미 로그인 중이에요.');
    approvedUid = null;
    let done;
    const wait = new Promise(resolve => { done = resolve; });
    connection = wait;
    sync();
    try {
      const result = await operation();
      if (intent === 'signup' && result?.user?.uid && result.user.uid === uidNow()) approvedUid = result.user.uid;
      return result;
    } finally {
      connection = null;
      done();
      sync();
    }
  }
  function rememberRedirect(state, intent) {
    sessionStorage.setItem(redirectKey, JSON.stringify({state,intent}));
  }
  function takeRedirect(state) {
    try {
      const item = JSON.parse(sessionStorage.getItem(redirectKey) || 'null');
      sessionStorage.removeItem(redirectKey);
      return item?.state === state && item.intent === 'signup' ? 'signup' : 'login';
    } catch { return 'login'; }
  }
  function observe(uid) {
    if (verifiedUid !== uid) verifiedUid = null;
    if (approvedUid !== uid) approvedUid = null;
    if (lookup?.uid !== uid) lookup = null;
  }
  async function verify(job, ref) {
    const uid = job.uid;
    const current = () => uidNow() === uid && lookup === job;
    let message;
    try {
      const doc = await ref.get({source:'server'});
      if (!current()) return false;
      if (!doc.exists || doc.data()?.confirmed !== true) {
        if (connection) await connection;
        if (!current()) return false;
        if (approvedUid !== uid) {
          message = '이 계정은 연령 확인이 필요해요. 회원가입에서 확인하고 같은 계정으로 연결해 주세요.';
          throw Error('age confirmation required');
        }
        await db.runTransaction(async tx => {
          const saved = await tx.get(ref);
          if (!current() || approvedUid !== uid) throw Error('account changed');
          if (!saved.exists) tx.set(ref,{confirmed:true,confirmedAt:firebase.firestore.FieldValue.serverTimestamp()});
          else if (saved.data()?.confirmed !== true) throw Error('invalid confirmation');
        });
      }
      if (!current()) return false;
      verifiedUid = uid;
      try { localStorage.setItem(hintKey,'1'); } catch {}
      return true;
    } catch {
      if (current()) {
        clearLocalKakaoSessionForBan();
        await firebase.auth().signOut();
        if (!uidNow()) {
          if (message) {
            try { localStorage.removeItem(hintKey); } catch {}
            select('signup');
          }
          const notice = message || '연령 확인 기록을 확인하지 못했어요. 연결을 확인한 뒤 다시 로그인해 주세요.';
          if (document.getElementById('authOverlay').getClientRects().length) showAuthError(notice);
          else showToast(notice);
        }
      }
      return false;
    } finally { if (approvedUid === uid) approvedUid = null; }
  }
  function ensure(user) {
    if (!user?.uid || user.isAnonymous || user.uid !== uidNow()) return Promise.resolve(false);
    if (verifiedUid === user.uid) return Promise.resolve(true);
    if (lookup?.uid === user.uid) return lookup.promise;
    const job = {uid:user.uid};
    lookup = job;
    const ref = db.collection('users').doc(user.uid).collection('accountChecks').doc('age14');
    job.promise = verify(job,ref).finally(() => { if (lookup === job) lookup = null; });
    return job.promise;
  }
  window.TaekilAccountAge = {entry,open,sync,connect,rememberRedirect,takeRedirect,observe,ensure,
    confirmed:() => !!verifiedUid && verifiedUid === uidNow()};
})();
