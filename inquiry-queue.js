/* Homepage inquiry management. Dates are sorted locally so older records do not need an index migration. */
function mountInquiryQueue({wrap, pendingCount, db, current, toast}) {
  const statuses = {pending: '대기', answered: '답변완료'};
  const labels = {pending: '답변 대기', answered: '답변 완료'};
  const cache = new Map();
  const drafts = new Map();
  const busy = new Set();
  let selected = 'pending';
  let visible = 20;
  let revision = 0;
  wrap.innerHTML = '<div class="inquiry-toolbar"><div class="inquiry-switch" role="group" aria-label="문의 상태"></div><button class="inquiry-refresh" type="button">새로고침</button></div><p class="inquiry-summary" role="status"></p><div class="inquiry-rows"></div>';
  const group = wrap.querySelector('.inquiry-switch');
  const rows = wrap.querySelector('.inquiry-rows');
  const summary = wrap.querySelector('.inquiry-summary');
  const active = () => current() && rows.parentNode === wrap;
  function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    if (tag === 'button') node.type = 'button';
    return node;
  }
  for (const key of Object.keys(labels)) {
    const button = element('button', labels[key]);
    button.dataset.status = key;
    button.onclick = () => {
      if (selected === key) return;
      selected = key;
      visible = 20;
      load();
    };
    group.append(button);
  }
  function createCard(doc) {
    const q = doc.data();
    const card = element('article', '', 'admin-inq-card');
    const title = element('h3', q.title || '(제목 없음)');
    const time = q.createdAt?.toMillis?.() || q.createdAtMs;
    const meta = [q.name || '회원', time && new Date(time).toLocaleDateString('ko-KR')].filter(Boolean);
    card.append(element('small', meta.join(' · ')), title, element('p', q.message || '', 'inquiry-body'));
    const editor = element('textarea', '');
    editor.rows = 3;
    editor.placeholder = '회원에게 전달할 답변을 작성해 주세요.';
    editor.setAttribute('aria-label', title.textContent + '에 대한 답변');
    const draft = drafts.get(doc.id);
    if (draft && (draft.reply !== q.reply || draft.status !== q.status)) drafts.delete(doc.id);
    editor.value = drafts.get(doc.id)?.text ?? q.reply ?? '';
    editor.oninput = () => drafts.set(doc.id, {text: editor.value, reply: q.reply, status: q.status});
    const save = element('button', selected === 'pending' ? '답변 등록' : '수정 저장', 'btn btn-primary');
    const editorBox = element(selected === 'answered' ? 'details' : 'div', '');
    if (selected === 'answered') {
      card.append(element('p', q.reply || '', 'inquiry-saved'));
      editorBox.append(element('summary', '답변 수정'));
    }
    save.disabled = editor.disabled = busy.has(doc.id);
    save.onclick = async () => {
      if (!active() || busy.has(doc.id)) return;
      const reply = editor.value.trim();
      if (!reply) { toast('답변 내용을 입력해 주세요.'); editor.focus(); return; }
      busy.add(doc.id);
      save.disabled = editor.disabled = true;
      try {
        await db.runTransaction(async tx => {
          const latest = await tx.get(doc.ref);
          if (!active()) throw Error('inactive');
          if (!latest.exists || latest.data().reply !== q.reply || latest.data().status !== q.status) throw Error('changed');
          tx.update(doc.ref, {reply, status: statuses.answered});
        });
        drafts.delete(doc.id);
        cache.delete('answered');
        if (cache.has('pending')) {
          const pending = cache.get('pending').filter(item => item.id !== doc.id);
          cache.set('pending', pending);
          if (active() && pendingCount) pendingCount.textContent = String(pending.length);
        }
        if (active()) { toast('답변을 저장했어요.'); load(); }
      } catch (err) {
        if (active()) toast(err.message === 'changed' ? '문의가 변경됐어요. 새로고침한 뒤 최신 답변을 확인해 주세요.' : '답변을 저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
      } finally {
        busy.delete(doc.id);
        if (active()) {
          for (const control of rows.querySelectorAll('[data-inquiry-id]')) {
            if (control.dataset.inquiryId === doc.id) control.disabled = false;
          }
        }
      }
    };
    editor.dataset.inquiryId = save.dataset.inquiryId = doc.id;
    editorBox.append(editor, save);
    card.append(editorBox);
    return card;
  }
  async function load(force = false) {
    if (!active()) return;
    const seq = ++revision;
    const key = selected;
    for (const button of group.children) button.setAttribute('aria-pressed', String(button.dataset.status === key));
    rows.replaceChildren();
    if (force) cache.clear();
    try {
      if (!cache.has(key)) {
        summary.textContent = '문의를 불러오고 있어요…';
        const snap = await db.collection('inquiries').where('status', '==', statuses[key]).get({source: 'server'});
        if (!active() || seq !== revision) return;
        const ms = doc => doc.data().createdAt?.toMillis?.() || doc.data().createdAtMs || 0;
        cache.set(key, snap.docs.slice().sort((a,b) => ms(b) - ms(a) || a.id.localeCompare(b.id)));
      }
      const docs = cache.get(key);
      if (key === 'pending' && pendingCount) pendingCount.textContent = String(docs.length);
      summary.textContent = docs.length ? labels[key] + ' ' + docs.length + '건' : (key === 'pending' ? '답변을 기다리는 문의가 없어요.' : '아직 답변을 완료한 문의가 없어요.');
      docs.slice(0, visible).forEach(doc => rows.append(createCard(doc)));
      if (visible < docs.length) {
        const more = element('button', '문의 더 보기', 'btn');
        more.onclick = () => { visible += 20; load(); };
        rows.append(more);
      }
    } catch {
      if (!active() || seq !== revision) return;
      if (key === 'pending' && pendingCount) pendingCount.textContent = '–';
      summary.textContent = '문의 목록을 불러오지 못했어요. 새로고침해 주세요.';
    }
  }
  wrap.querySelector('.inquiry-refresh').onclick = () => load(true);
  wrap.openPendingInquiries = () => {
    selected = 'pending';
    visible = 20;
    return load(true);
  };
  load();
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const notice = document.getElementById('adminPendingInquiryNotice');
    const topbar = document.querySelector('.topbar');
    if (!notice || !topbar) return;
    topbar.append(notice);
    const count = notice.querySelector('strong');
    let owner = null;
    let unsubscribe = null;
    function show(pending) {
      count.textContent = pending > 0 ? pending.toLocaleString('ko-KR')+'건' : '';
      notice.hidden = pending < 1;
    }
    function authorizedOwner() {
      if (!db || !isAdmin() || !firebaseAuthUser?.emailVerified) return null;
      const account = window.accountStore?.owner();
      return account === firebaseAuthUser.uid ? account : null;
    }
    function sync() {
      const current = authorizedOwner();
      if (current === owner && unsubscribe) return;
      unsubscribe?.();
      unsubscribe = null;
      owner = current;
      show(0);
      if (!owner) return;
      unsubscribe = db.collection('inquiries').where('status','==','대기').onSnapshot({includeMetadataChanges:true}, snap => {
        if (authorizedOwner() !== current || owner !== current || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
        show(snap.size);
      }, () => {
        if (owner !== current) return;
        unsubscribe = null;
        show(0);
      });
    }
    notice.querySelector('button').addEventListener('click', () => {
      if (!authorizedOwner()) return;
      if (document.getElementById('view-admin').classList.contains('visible')) {
        document.getElementById('adminInquiryList').openPendingInquiries?.();
      } else {
        goTo('admin');
      }
      openAndGoAdminFold('adminFoldSupport');
      document.querySelector('#adminFoldSupport .admin-fold-toggle').focus({preventScroll:true});
    });
    window.addEventListener('taekilso:authChanged',sync);
    window.addEventListener('online',sync);
    window.addEventListener('pageshow',sync);
    sync();
  }, {once:true});
}
