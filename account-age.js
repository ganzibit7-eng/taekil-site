(() => {
  'use strict';
  const dialog = document.getElementById('accountAgeDialog');
  const checkbox = document.getElementById('authAgeConfirmed');
  const form = dialog.querySelector('form');
  const submit = form.querySelector('[type="submit"]');
  const cancel = form.querySelector('[type="button"]');
  const status = dialog.querySelector('[role="status"]');
  let verifiedUid = null;
  let pending = null;
  const currentUid = () => window.firebase?.auth()?.currentUser?.uid || null;
  function finish(job, ok) {
    if (job !== pending) return;
    pending = null;
    if (dialog.open) dialog.close();
    checkbox.checked = false;
    if (ok) verifiedUid = job.uid;
    job.resolve(ok);
  }
  function observe(uid) {
    if (verifiedUid !== uid) verifiedUid = null;
    if (pending && pending.uid !== uid) finish(pending, false);
  }
  function active(job) { return pending === job && currentUid() === job.uid; }
  function display(job, failed) {
    if (!active(job)) return;
    job.retry = failed;
    submit.textContent = failed ? '다시 확인하기' : '확인하고 계속하기';
    checkbox.closest('label').hidden = failed;
    submit.disabled = !failed && !checkbox.checked;
    cancel.disabled = false;
    status.textContent = failed ? '계정의 확인 기록을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.' : '';
    if (!dialog.open) dialog.showModal();
  }
  async function read(job) {
    try {
      const doc = await job.ref.get({source:'server'});
      if (!active(job)) return;
      if (doc.exists && doc.data()?.confirmed === true) finish(job, true);
      else display(job, false);
    } catch { display(job, true); }
  }
  function ensure(user) {
    const uid = user?.uid;
    if (!uid || user.isAnonymous || uid !== currentUid()) return Promise.resolve(false);
    observe(uid);
    if (verifiedUid === uid) return Promise.resolve(true);
    if (pending) return pending.promise;
    const ref = db.collection('users').doc(uid).collection('accountChecks').doc('age14');
    const job = {uid, ref};
    job.promise = new Promise(resolve => { job.resolve = resolve; });
    pending = job;
    checkbox.disabled = cancel.disabled = false;
    checkbox.checked = false;
    read(job);
    return job.promise;
  }
  function decline() {
    const job = pending;
    if (!job || !active(job) || cancel.disabled) return;
    clearLocalKakaoSessionForBan();
    const leaving = firebase.auth().signOut();
    finish(job, false);
    leaving.catch(() => showToast('로그아웃을 완료하지 못했어요. 다시 로그인해 주세요.'));
  }
  cancel.onclick = decline;
  dialog.addEventListener('cancel', e => { e.preventDefault(); decline(); });
  checkbox.onchange = () => { submit.disabled = !checkbox.checked; };
  form.onsubmit = async event => {
    event.preventDefault();
    const job = pending;
    if (!job || !active(job) || submit.disabled) return;
    submit.disabled = true;
    if (job.retry) { await read(job); return; }
    if (!checkbox.checked) return;
    cancel.disabled = checkbox.disabled = true;
    status.textContent = '확인 기록을 저장하고 있어요.';
    try {
      await db.runTransaction(async tx => {
        const doc = await tx.get(job.ref);
        if (!active(job)) throw Error('account changed');
        if (!doc.exists) tx.set(job.ref, {confirmed:true, confirmedAt:firebase.firestore.FieldValue.serverTimestamp()});
        else if (doc.data()?.confirmed !== true) throw Error('invalid record');
      });
      if (active(job)) finish(job, true);
    } catch {
      if (active(job)) {
        status.textContent = '저장하지 못했어요. 연결을 확인하고 다시 눌러 주세요.';
        submit.disabled = false;
      }
    } finally { if (!pending || pending === job) checkbox.disabled = cancel.disabled = false; }
  };
  window.TaekilAccountAge = {ensure, observe, confirmed:() => !!verifiedUid && verifiedUid === currentUid()};
})();
