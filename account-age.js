(() => {
  'use strict';
  const checkbox = document.getElementById('authAgeConfirmed');
  const ageDialog = document.getElementById('accountAgeCheck');
  const actions = document.querySelectorAll('#authOverlay button[data-provider]');
  const ageRow = checkbox.closest('label');
  const hintKey = 'taekilso_returning_member';
  const redirectKey = 'taekilso_age_redirect';
  let verifiedUid, lookup, connection, approvedUid, pendingCheck;
  const uidNow = () => window.firebase?.auth()?.currentUser?.uid;
  function sync() {
    for (const button of actions) button.disabled = !!connection || (!ageRow.hidden && !checkbox.checked);
  }
  function open() {
    let returning = false;
    try { returning = localStorage.getItem(hintKey) === '1'; } catch {}
    ageRow.hidden = returning;
    checkbox.checked = false;
    sync();
  }
  function finishCheck(accepted) {
    if (!pendingCheck) return;
    const {uid, resolve} = pendingCheck;
    pendingCheck = null;
    ageDialog.close();
    resolve(accepted && uid === uidNow());
  }
  ageDialog.addEventListener('cancel', event => {
    event.preventDefault();
    finishCheck(false);
  });
  ageDialog.addEventListener('submit', event => {
    event.preventDefault();
    finishCheck(event.submitter?.value === 'confirm');
  });
  function confirmCurrentAccount(uid) {
    return new Promise(resolve => {
      ageDialog.showModal();
      pendingCheck = {uid, resolve};
    });
  }
  checkbox.onchange = sync;
  open();
  function entry() {
    if (connection) return null;
    if (!ageRow.hidden && !checkbox.checked) { checkbox.focus(); return null; }
    return checkbox.checked && !ageRow.hidden ? 'signup' : 'login';
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
    if (pendingCheck && pendingCheck.uid !== uid) finishCheck(false);
    if (verifiedUid !== uid) verifiedUid = null;
    if (approvedUid !== uid) approvedUid = null;
    if (lookup?.uid !== uid) lookup = null;
  }
  async function verify(job, ref) {
    const uid = job.uid;
    const current = () => uidNow() === uid && lookup === job;
    let cancelled = false;
    try {
      const doc = await ref.get({source:'server'});
      if (!current()) return false;
      if (!doc.exists || doc.data()?.confirmed !== true) {
        if (connection) await connection;
        if (!current()) return false;
        if (approvedUid !== uid) {
          const accepted = await confirmCurrentAccount(uid);
          if (!current()) return false;
          if (!accepted) {
            cancelled = true;
            throw Error('age confirmation cancelled');
          }
          approvedUid = uid;
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
        if (!uidNow() && !cancelled) {
          const notice = '연령 확인 기록을 확인하지 못했어요. 연결을 확인한 뒤 다시 로그인해 주세요.';
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
