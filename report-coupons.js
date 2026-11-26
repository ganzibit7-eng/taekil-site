(() => {
  'use strict';
  const products = {
    taekilso_seohwa_story_report: ['서화의 연애·관계 리포트', '/consultation/love/'],
    taekilso_dogyeom_story_report: ['도겸의 재물운 리포트', '/consultation/wealth/'],
    taekilso_ijun_story_report: ['이준의 재회운 리포트', '/consultation/reunion/'],
    taekilso_mujin_story_report: ['무진의 직업·이직 리포트', '/consultation/career/'],
    taekilso_newyear_2027_report: ['2027 신년운세 리포트', '/consultation/newyear/'],
    taekilso_relationship_report: ['두 사람 관계 리포트', '#relationship-report'],
    taekilso_date_report: ['정밀 택일 리포트', '#tool']
  };
  const states = {issued:'미등록', redeemed:'등록 완료', revoked:'회수', expired:'기한 만료'};
  const giftDetails = {
    taekilso_seohwa_story_report:'연애할 때 마음을 표현하는 방식과 관계의 월별 흐름을 읽어요. 서화와의 채팅 상담 3회가 포함돼요.',
    taekilso_dogyeom_story_report:'돈이 들어오는 흐름과 손에 남기기 좋은 시기를 월별로 살펴봐요. 도겸과의 채팅 상담 3회가 포함돼요.',
    taekilso_ijun_story_report:'다시 연락할 때 살펴볼 점과 두 사람 사이의 거리를 내 사주로 읽어요. 이준과의 채팅 상담 3회가 포함돼요.',
    taekilso_mujin_story_report:'내게 맞는 일의 조건과 이직을 고민할 시기를 살펴봐요. 무진과의 채팅 상담 3회가 포함돼요.',
    taekilso_newyear_2027_report:'내 사주로 2027년의 큰 흐름과 열두 달의 운세를 읽는 신년 리포트예요.',
    taekilso_relationship_report:'두 사람의 일주를 비교해 잘 맞는 점, 자주 엇갈리는 상황과 써볼 만한 대화 방법을 읽어요.',
    taekilso_date_report:'이사·결혼 등 중요한 일정의 후보일 2~5개를 비교해 날짜별 순위와 풀이 근거를 확인해요.'
  };
  const deadlineFormat = new Intl.DateTimeFormat('ko-KR',{
    timeZone:'Asia/Seoul', year:'numeric', month:'long', day:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'
  });
  function deadline(value) {
    return value == null ? '등록 기한 없음' : deadlineFormat.format(value) + '까지 (한국시간)';
  }
  function giftText(coupon, number) {
    return [
      '[택일소 리포트 선물권]', products[coupon.product][0]+' 1편', giftDetails[coupon.product], '',
      '쿠폰 번호: '+number, '등록 기한: '+deadline(coupon.expiresAtMs), '이용 기간: 쿠폰을 등록한 날부터 1년', '',
      '등록하기', 'https://taekilso.com/#profile', '',
      '등록 방법', '1. 위 링크로 내 프로필을 열고 로그인해 주세요.',
      '2. ‘리포트 쿠폰 등록’에 이 메시지 또는 쿠폰 번호를 붙여넣고 등록해 주세요.',
      '3. ‘사용 가능한 리포트’에서 ‘리포트 시작’을 눌러 안내에 따라 정보를 입력한 뒤, ‘리포트 쿠폰 사용’을 선택해 주세요.', '',
      '먼저 등록한 한 계정에서 한 번 사용할 수 있어요.'
    ].join('\n');
  }
  function enableGiftPaste(input) {
    input.addEventListener('paste', event => {
      const value = event.clipboardData?.getData('text/plain') || '';
      const rows = value.split(/\r?\n/).filter(row => /^\s*쿠폰 번호\s*[:：]/.test(row));
      if (rows.length !== 1) return;
      const number = rows[0].replace(/^\s*쿠폰 번호\s*[:：]\s*/, '').trim();
      try {
        const raw = normalize(number);
        event.preventDefault();
        input.value = raw.match(/.{4}/g).join('-');
        input.dispatchEvent(new Event('input',{bubbles:true}));
      } catch (_) { /* Keep normal paste and validation for unrecognized messages. */ }
    });
  }
  const byId = id => document.getElementById(id);
  const store = window.accountStore;
  const day = new Intl.DateTimeFormat('ko-KR', {year:'numeric', month:'long', day:'numeric', timeZone:'Asia/Seoul'});
  const signInMessage = '로그인한 계정을 확인한 뒤 다시 시도해 주세요.';
  let cache = null;
  let issueIntent = null;
  let visibleOwner = store.snapshot();
  let profileOpen = false;
  let adminOpen = false;
  let adminRequest = 0;
  let profileRequest = 0;
  let uncertainCouponId = null;

  function normalize(code) {
    const value = String(code || '').toUpperCase().replace(/[\s-]/g, '');
    if (!/^(?:[0-9A-HJKMNP-TV-Z]{16}){1,2}$/.test(value)) throw new Error('쿠폰 번호 16자리 또는 기존 번호 32자리를 확인해 주세요.');
    return value;
  }
  async function request(payload, token) {
    if (!token?.owner || !store.current(token)) throw new Error(signInMessage);
    const headers = await getAiRequestHeaders();
    if (!headers.Authorization || !store.current(token)) throw new Error(signInMessage);
    let response, data;
    try {
      response = await fetch(AI_CHAT_URL.replace(/\/ai-chat$/, '/report-coupons'), {
        method:'POST', headers, body:JSON.stringify(payload), credentials:'omit',
        referrerPolicy:'no-referrer', cache:'no-store', signal:AbortSignal.timeout(20000)
      });
      data = await response.json();
    } catch (_) {
      throw new Error('서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
    if (!store.current(token)) throw new Error(signInMessage);
    if (!response.ok || !data.ok) {
      const code = data.code || data.error;
      const messages = {
        COUPON_UNAVAILABLE:'이미 등록됐거나 사용할 수 없는 쿠폰이에요. 번호와 등록 기한을 확인해 주세요.',
        COUPON_ALREADY_ISSUED:'이미 발급된 요청이에요. 목록에서 방금 발급을 요청한 쿠폰을 확인하고, 번호를 받지 못했다면 회수한 뒤 다시 발급해 주세요.',
        COUPON_NOT_REVOCABLE:'이 쿠폰은 이미 등록됐거나 기한이 끝나 회수할 수 없어요.'
      };
      const fallback = response.status === 429 ? '요청이 많아요. 잠시 후 다시 시도해 주세요.'
        : response.status === 403 ? '이 계정의 이용 권한을 확인해 주세요.'
        : response.status === 401 ? signInMessage : '쿠폰을 처리하지 못했어요. 잠시 후 다시 확인해 주세요.';
      const error = new Error(messages[code] || fallback);
      error.code = code;
      throw error;
    }
    return data;
  }
  function invalidate() { cache = null; }
  function wallet(token) {
    if (!token?.owner || !store.current(token)) return Promise.resolve([]);
    if (cache && store.current(cache.token) && cache.until > Date.now()) return cache.promise;
    const next = {token, until:Date.now() + 30000};
    next.promise = request({action:'wallet'}, token).then(data => data.passes).catch(error => {
      if (cache === next) invalidate();
      throw error;
    });
    cache = next;
    return next.promise;
  }
  function isAvailable(pass) {
    return pass.state === 'available' && pass.expiresAtMs > Date.now() && Object.hasOwn(products, pass.product);
  }
  async function available(product, token = store.snapshot()) {
    if (!Object.hasOwn(products, product) || !token.owner) return null;
    const passes = await wallet(token);
    if (!store.current(token)) throw new Error(signInMessage);
    return passes.filter(pass => pass.product === product && isAvailable(pass)).sort((a,b) => a.expiresAtMs - b.expiresAtMs)[0] || null;
  }
  async function redeem(code, token = store.snapshot()) {
    const data = await request({action:'redeem', code:normalize(code)}, token);
    invalidate();
    return data;
  }
  function focusRedeem() {
    goTo('profile');
    byId('couponNumber').focus();
  }
  window.TaekilReportCoupons = Object.freeze({available, redeem, invalidate, focusRedeem, enableGiftPaste});

  function node(tag, label, className) {
    const el = document.createElement(tag);
    if (label) el.textContent = label;
    if (className) el.className = className;
    return el;
  }
  function message(id, value) { byId(id).textContent = value; }
  function setBusy(form, busy) {
    form.setAttribute('aria-busy', String(busy));
    for (const el of form.elements) el.disabled = busy;
  }
  function action(label, fn) {
    const button = node('button', label, 'coupon-action');
    button.type = 'button';
    button.addEventListener('click', fn);
    return button;
  }
  function linkToReport(product) {
    const [name, path] = products[product];
    const link = node('a', '리포트 시작', 'coupon-action');
    link.href = path;
    link.setAttribute('aria-label', name + ' 시작');
    if (path.startsWith('#')) link.addEventListener('click', event => {
      event.preventDefault();
      goTo(path.slice(1));
    });
    return link;
  }
  async function showWallet(token) {
    const target = byId('couponWallet');
    const sequence = ++profileRequest;
    const current = () => profileOpen && store.current(token) && sequence === profileRequest;
    try {
      const passes = (await wallet(token)).filter(isAvailable).sort((a,b) => a.expiresAtMs - b.expiresAtMs);
      if (!current()) return;
      target.replaceChildren();
      if (!passes.length) return;
      target.append(node('h3','사용 가능한 리포트'));
      for (const pass of passes) {
        const row = node('div', '', 'coupon-row');
        const item = node('div');
        item.append(node('strong', products[pass.product][0]), node('small', day.format(pass.expiresAtMs) + '까지 사용'));
        row.append(item, linkToReport(pass.product));
        target.append(row);
      }
    } catch (error) {
      if (current()) target.replaceChildren(node('p','등록된 쿠폰을 불러오지 못했어요.'), action('다시 확인', () => showWallet(token)));
    }
  }
  async function submitRedeem(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.getAttribute('aria-busy') === 'true') return;
    const token = store.snapshot();
    if (!token.owner) {
      message('couponRedeemStatus','로그인 후 이 계정에 쿠폰을 등록할 수 있어요.');
      if (typeof openAuthModal === 'function') openAuthModal();
      return;
    }
    setBusy(form,true);
    const status = byId('couponRedeemStatus');
    status.textContent = '쿠폰을 확인하고 있어요.';
    try {
      const {pass, alreadyRedeemed} = await redeem(byId('couponNumber').value, token);
      if (!store.current(token)) return;
      byId('couponNumber').value = '';
      if (pass.state === 'used') {
        status.replaceChildren(document.createTextNode('이미 리포트에 사용한 쿠폰이에요. '), action('내 리포트 보기', openReportHistory));
      } else {
        status.textContent = products[pass.product][0] + (alreadyRedeemed ? ' 쿠폰이 이 계정에 이미 등록돼 있어요.' : ' 쿠폰을 등록했어요.') + ' 리포트를 시작해 출생 정보를 입력한 뒤 쿠폰으로 열어 주세요.';
      }
      await showWallet(token);
    } catch (error) {
      if (store.current(token)) status.textContent = error.message;
    } finally {
      if (store.current(token)) setBusy(form,false);
    }
  }
  function clearIssued() {
    byId('couponIssuedNumber').value = '';
    byId('couponGiftText').value = '';
    byId('couponGiftPreview').open = false;
    byId('couponGiftTitle').textContent = '';
    byId('couponGiftDeadline').textContent = '';
    byId('couponIssued').hidden = true;
  }
  function adminCurrent(token) {
    return adminOpen && store.current(token) && token.owner && typeof isAdmin === 'function' && isAdmin();
  }
  async function revoke(coupon, button) {
    const token = store.snapshot();
    if (!adminCurrent(token) || button.disabled || !window.confirm('끝번호 ' + coupon.hint + '인 미등록 쿠폰을 회수할까요?')) return;
    button.disabled = true;
    try {
      await request({action:'revoke', couponId:coupon.couponId},token);
      if (!adminCurrent(token)) return;
      if (byId('couponIssued').dataset.id === coupon.couponId) clearIssued();
      message('couponAdminStatus', '쿠폰을 회수했어요.');
      await showAdminList(token);
    } catch (error) {
      if (adminCurrent(token)) {
        message('couponAdminStatus', error.message);
        await showAdminList(token);
      }
    }
  }
  async function showAdminList(token, cursor = null) {
    if (!adminCurrent(token)) return;
    const sequence = ++adminRequest;
    const target = byId('couponAdminList');
    try {
      const {coupons, nextCursor} = await request(cursor ? {action:'list', cursor} : {action:'list'},token);
      if (!adminCurrent(token) || sequence !== adminRequest) return;
      if (cursor) target.querySelector('[data-more]')?.remove();
      else target.replaceChildren();
      if (!cursor && !coupons.length) target.append(node('p','아직 발급한 쿠폰이 없어요.'));
      for (const coupon of coupons) {
        const row = node('div', '', 'coupon-row');
        const item = node('div');
        const detail = '끝번호 ' + coupon.hint + ' · ' + day.format(coupon.issuedAtMs) + ' 발급'
          + (coupon.expiresAtMs ? ' · ' + day.format(coupon.expiresAtMs) + '까지 등록' : '');
        item.append(node('strong', products[coupon.product]?.[0] || '리포트 쿠폰'), node('small',detail));
        if (coupon.couponId === uncertainCouponId) item.append(node('small','방금 발급을 요청한 쿠폰'));
        row.append(item, node('span',states[coupon.status] || '상태 확인', 'coupon-state'));
        if (coupon.status === 'issued') row.append(action('회수', e => revoke(coupon,e.currentTarget)));
        target.append(row);
      }
      if (nextCursor) {
        const more = action('이전 발급 내역 더 보기',event => {
          event.currentTarget.disabled = true;
          showAdminList(token,nextCursor);
        });
        more.dataset.more = 'true';
        target.append(more);
      }
    } catch (error) {
      if (!adminCurrent(token) || sequence !== adminRequest) return;
      if (cursor && target.querySelector('[data-more]')) {
        target.querySelector('[data-more]').disabled = false;
        message('couponAdminStatus',error.message);
      } else target.replaceChildren(node('p',error.message));
    }
  }
  async function issue(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = store.snapshot();
    if (!adminCurrent(token) || form.getAttribute('aria-busy') === 'true') return;
    const product = byId('couponProduct').value;
    const validDays = Number(byId('couponValidity').value);
    if (!issueIntent || issueIntent.product !== product || issueIntent.validDays !== validDays) {
      issueIntent = {action:'issue', product, validDays, requestId:crypto.randomUUID()};
    }
    setBusy(form,true);
    clearIssued();
    message('couponAdminStatus', '쿠폰을 발급하고 있어요.');
    try {
      const {code,coupon} = await request(issueIntent,token);
      if (!store.current(token)) return;
      issueIntent = null;
      uncertainCouponId = null;
      if (!adminCurrent(token)) return;
      const number = normalize(code).match(/.{4}/g).join('-');
      byId('couponIssuedNumber').value = number;
      byId('couponGiftTitle').textContent = products[coupon.product][0]+' 선물권';
      byId('couponGiftDeadline').textContent = '등록 기한 · '+deadline(coupon.expiresAtMs);
      byId('couponGiftText').value = giftText(coupon,number);
      byId('couponIssued').dataset.id = coupon.couponId;
      byId('couponIssued').hidden = false;
      message('couponAdminStatus', products[product][0] + ' 쿠폰 1장을 발급했어요.');
      await showAdminList(token);
    } catch (error) {
      if (store.current(token) && issueIntent) {
        uncertainCouponId = issueIntent.requestId;
        if (error.code === 'COUPON_ALREADY_ISSUED') issueIntent = null;
      }
      if (adminCurrent(token)) {
        message('couponAdminStatus',error.message);
        await showAdminList(token);
      }
    } finally {
      if (store.current(token)) setBusy(form,false);
    }
  }
  async function copyIssued(fullGift) {
    const token = store.snapshot();
    const field = byId(fullGift ? 'couponGiftText' : 'couponIssuedNumber');
    if (!adminCurrent(token) || byId('couponIssued').hidden || !field.value) return;
    try {
      await navigator.clipboard.writeText(field.value);
      if (adminCurrent(token)) message('couponAdminStatus',fullGift ? '선물 안내를 복사했어요. 받는 분과의 대화에 붙여넣어 주세요.' : '쿠폰 번호를 복사했어요.');
    } catch (_) {
      if (!adminCurrent(token)) return;
      if (fullGift) byId('couponGiftPreview').open = true;
      field.focus();
      field.select();
      message('couponAdminStatus','문구를 선택했어요. 길게 눌러 복사하거나 복사 단축키를 사용해 주세요.');
    }
  }
  function syncViews() {
    const token = store.snapshot();
    const changed = !store.current(visibleOwner);
    if (changed) {
      visibleOwner = token;
      invalidate();
      issueIntent = null;
      uncertainCouponId = null;
      byId('couponNumber').value = '';
      byId('couponWallet').replaceChildren();
      message('couponRedeemStatus','');
      setBusy(byId('couponRedeemForm'),false);
      setBusy(byId('couponIssueForm'),false);
    }
    const profile = byId('view-profile').classList.contains('visible') && !!token.owner;
    if (profile && (!profileOpen || changed)) {
      profileOpen = true;
      showWallet(token);
    } else profileOpen = profile;
    const admin = !!token.owner && typeof isAdmin === 'function' && isAdmin() &&
      byId('view-admin').classList.contains('visible') && byId('adminFoldCoupons').classList.contains('open');
    if (changed || (adminOpen && !admin)) {
      clearIssued();
      message('couponAdminStatus','');
      byId('couponAdminList').replaceChildren();
    }
    if (admin && (!adminOpen || changed)) {
      adminOpen = true;
      showAdminList(token);
    } else adminOpen = admin;
  }
  function init() {
    if (!byId('couponIssueForm') || !byId('couponRedeemForm')) return;
    for (const [code,[label]] of Object.entries(products)) byId('couponProduct').add(new Option(label,code));
    byId('couponRedeemForm').addEventListener('submit',submitRedeem);
    byId('couponIssueForm').addEventListener('submit',issue);
    enableGiftPaste(byId('couponNumber'));
    byId('couponCopyGift').addEventListener('click',()=>copyIssued(true));
    byId('couponCopy').addEventListener('click',()=>copyIssued(false));
    byId('couponDone').addEventListener('click',clearIssued);
    byId('couponRefresh').addEventListener('click',() => showAdminList(store.snapshot()));
    const observer = new MutationObserver(syncViews);
    for (const id of ['view-profile','view-admin','adminFoldCoupons']) observer.observe(byId(id),{attributes:true,attributeFilter:['class']});
    window.addEventListener('taekilso:authChanged',syncViews);
    window.addEventListener('pagehide', () => { clearIssued(); byId('couponNumber').value = ''; });
    syncViews();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
