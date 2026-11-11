// Presentation only. Account and navigation actions use the existing handlers.
(() => {
  const header = document.querySelector('.nav-right');
  const account = document.getElementById('authNavBtn');
  if (!header || !account || document.getElementById('siteMenu')) return;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'site-menu-trigger';
  trigger.setAttribute('aria-label', '전체 메뉴 열기');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'siteMenu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 7h20M4 14h20M4 21h20"/></svg>';
  const menu = document.createElement('dialog');
  menu.id = 'siteMenu';
  menu.className = 'site-menu';
  menu.setAttribute('aria-labelledby', 'siteMenuTitle');
  menu.innerHTML = `<div class="site-menu-heading"><h2 id="siteMenuTitle">택일소</h2><button class="site-menu-close" type="button" aria-label="전체 메뉴 닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <button type="button" class="site-menu-account" aria-label="내 프로필 보기">
      <img class="site-menu-account-mark" src="/assets/brand-emblem-transparent.png?v=20261111-1" width="46" height="46" alt="">
      <span class="site-menu-account-copy">
        <span class="site-menu-caption">나의 택일소</span>
        <span id="siteMenuAccountNote"></span>
      </span>
    </button>
    <div data-menu-account hidden></div>
    <nav aria-label="전체 메뉴">
      <div class="site-menu-group"><h3>연우와 함께</h3><button data-menu-route="home">홈 · 연우 상담</button><button data-menu-route="tool">사주 · 날짜 찾기</button><button data-menu-route="newyear">2027 신년상담</button><button data-menu-route="history">나의 상담 기록</button></div>
      <div class="site-menu-group"><h3>중요한 날을 위해</h3><div class="site-menu-dates"><button data-menu-route="wedding">결혼식 택일</button><button data-menu-route="moving">이사 택일</button><button data-menu-route="opening">개업 택일</button><button data-menu-route="contract">계약 택일</button></div></div>
      <div class="site-menu-group site-menu-secondary"><h3>이용 안내</h3><button data-menu-route="plans">이용권 안내</button><button data-menu-route="services">서비스 안내</button><button data-menu-route="support">1:1 문의</button></div>
    </nav><p class="site-menu-signature">나의 때를 살피는 곳, 택일소</p>`;
  menu.querySelector('[data-menu-account]').append(account);
  account.setAttribute('role', 'button');
  account.setAttribute('aria-describedby', 'siteMenuAccountNote');
  account.tabIndex = 0;
  header.append(trigger);
  document.body.append(menu);
  document.body.classList.add('site-menu-ready');
  const refreshAccount = () => {
    menu.querySelector('#siteMenuAccountNote').textContent = account.classList.contains('logged-in')
      ? '내 프로필 보기' : '로그인하고 시작하기';
    menu.querySelector('.site-menu-account').setAttribute('aria-label', account.classList.contains('logged-in') ? '내 프로필 보기' : '로그인하기');
  };
  refreshAccount();
  new MutationObserver(refreshAccount).observe(account, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  const close = (restoreFocus = true) => {
    if (!menu.open) return;
    menu.close();
    document.documentElement.classList.remove('site-menu-open');
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  };
  trigger.addEventListener('click', () => {
    menu.querySelectorAll('[data-menu-route]').forEach(button => {
      const active = document.getElementById('view-' + button.dataset.menuRoute)?.classList.contains('visible');
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    menu.showModal();
    document.documentElement.classList.add('site-menu-open');
    trigger.setAttribute('aria-expanded', 'true');
    menu.querySelector('.site-menu-close').focus({ preventScroll: true });
  });
  menu.addEventListener('cancel', event => { event.preventDefault(); close(); });
  menu.addEventListener('click', event => {
    if (event.target === menu) {
      const bounds = menu.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }
  });
  menu.querySelector('.site-menu-close').addEventListener('click', () => close());
  // One native button makes the whole compact card clickable and keyboard accessible.
  menu.querySelector('.site-menu-account').addEventListener('click', () => account.click());
  menu.querySelectorAll('[data-menu-route]').forEach(button => button.addEventListener('click', () => {
    close(false);
    goTo(button.dataset.menuRoute);
    trigger.focus({ preventScroll: true });
  }));
  // Close before the unchanged account handler opens the login modal/profile.
  account.addEventListener('click', () => close(false), true);
  account.addEventListener('click', () => {
    if (document.getElementById('view-profile')?.classList.contains('visible')) {
      document.getElementById('profileHeading')?.focus({ preventScroll: true });
    }
  });
  account.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); account.click(); }
  });
  window.addEventListener('hashchange', () => close(false));

  // OS emoji fonts differ. Keep the original dynamic labels but render one SVG.
  const start = document.getElementById('homeStartChatBtn');
  if (start) {
    const normalizeLabel = () => {
      const text = start.textContent;
      if (/^✨\s*/u.test(text)) start.textContent = text.replace(/^✨\s*/u, '');
    };
    normalizeLabel();
    new MutationObserver(normalizeLabel).observe(start, { childList: true, subtree: true, characterData: true });
  }
})();
