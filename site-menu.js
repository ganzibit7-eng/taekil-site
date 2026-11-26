// Presentation only. Account and navigation actions use the existing handlers.
(() => {
  // Keep native focus and restore its visible indicator as soon as the keyboard is used.
  document.addEventListener('pointerdown', () => {
    document.documentElement.setAttribute('data-pointer-navigation', '');
  }, {capture:true, passive:true});
  document.addEventListener('keydown', () => {
    document.documentElement.removeAttribute('data-pointer-navigation');
  }, true);
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
  menu.innerHTML = `<div class="site-menu-heading">
      <h2 id="siteMenuTitle"><a href="/" data-site-home class="site-menu-brand" aria-label="택일소 홈">택일소</a></h2>
      <button class="site-menu-close" type="button" aria-label="전체 메뉴 닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
    </div>
    <button type="button" class="site-menu-account" aria-label="내 프로필 보기">
      <img class="site-menu-account-mark" src="/assets/brand-emblem-transparent.png?v=20261111-1" width="40" height="40" alt="">
      <span class="site-menu-account-copy">
        <span class="site-menu-caption">나의 택일소</span>
        <span id="siteMenuAccountNote"></span>
      </span>
    </button>
    <div data-menu-account hidden></div>
    <nav class="site-menu-navigation" aria-label="전체 메뉴">
      <section class="site-menu-group" aria-labelledby="siteMenuReadings">
        <h3 id="siteMenuReadings">사주 리포트</h3>
        <a href="/#directoryTopicsTitle" data-menu-home-section>사주 리포트 둘러보기</a>
        <button type="button" data-menu-basic-report>무료 사주 리포트</button>
        <button type="button" data-menu-route="newyear">2027년 신년운세</button>
      </section>
      <section class="site-menu-group" aria-labelledby="siteMenuChat">
        <h3 id="siteMenuChat">채팅 상담</h3>
        <a href="/#directoryChatTitle" data-menu-home-section>채팅 상담 둘러보기</a>
        <div class="site-menu-links">
          <a href="/#directoryRelationshipsTitle" data-menu-home-section>연애·궁합</a>
          <a href="/#directoryCareerTitle" data-menu-home-section>일·재물</a>
          <a href="/#directoryStudyTitle" data-menu-home-section>학업·성장</a>
          <a href="/#directoryLifeTitle" data-menu-home-section>생활·관계</a>
          <a href="/#directoryDatesTitle" data-menu-home-section>중요한 결정</a>
          <button type="button" data-menu-route="topics">전체 주제</button>
        </div>
        <button type="button" data-menu-route="history">나의 상담 기록</button>
      </section>
      <section class="site-menu-group" aria-labelledby="siteMenuDates">
        <h3 id="siteMenuDates">중요한 날짜</h3>
        <button type="button" data-menu-route="tool">좋은 날짜 찾기</button>
        <div class="site-menu-dates">
          <button type="button" data-menu-route="wedding">결혼식 택일</button>
          <button type="button" data-menu-route="moving">이사 택일</button>
          <button type="button" data-menu-route="opening">개업 택일</button>
          <button type="button" data-menu-route="contract">계약 택일</button>
        </div>
      </section>
      <section class="site-menu-group site-menu-secondary" aria-labelledby="siteMenuHelp">
        <h3 id="siteMenuHelp">이용 안내</h3>
        <button type="button" data-menu-route="plans">이용권 안내</button>
        <button type="button" data-menu-route="services">서비스 안내</button>
        <button type="button" data-menu-route="faq">자주 묻는 질문</button>
        <button type="button" data-menu-route="support">1:1 문의</button>
      </section>
    </nav>`;
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
    const homeLink = menu.querySelector('[data-site-home]');
    const onDirectory = document.documentElement.dataset.homeLayout === 'directory' &&
      document.getElementById('view-home')?.classList.contains('visible');
    if (onDirectory) homeLink.setAttribute('aria-current', 'page');
    else homeLink.removeAttribute('aria-current');
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
  menu.querySelector('[data-menu-basic-report]').addEventListener('click', () => {
    close();
    openSajuInsight('profile');
  });
  const focusHomeSection = hash => {
    const heading = document.getElementById(hash.slice(1));
    if (!heading?.matches('#homeDirectory .directory-section :is(h2,h3)[tabindex]')) return;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  document.querySelectorAll('[data-menu-home-section]').forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (document.documentElement.dataset.homeLayout !== 'directory' || location.pathname !== '/') return;
    event.preventDefault();
    close(false);
    if (document.documentElement.classList.contains('consultation-open')) document.getElementById('consultationExit')?.click();
    if (!document.getElementById('view-home')?.classList.contains('visible')) goTo('home');
    requestAnimationFrame(() => focusHomeSection(link.hash));
  }));
  window.addEventListener('pageshow', () => {
    if (document.documentElement.dataset.homeLayout === 'directory' && location.hash.startsWith('#directory')) {
      requestAnimationFrame(() => focusHomeSection(location.hash));
    }
  });
  document.querySelectorAll('a[data-site-home]').forEach(link => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // The ad landing uses its query string (or #ai-chat) to select a different home surface.
    // Let the real link open the directory whenever the current surface is the landing.
    if (document.documentElement.dataset.homeLayout !== 'directory' || location.pathname !== '/') return;
    event.preventDefault();
    const fromMenu = menu.contains(link);
    close(false);
    goTo('home');
    if (fromMenu) trigger.focus({ preventScroll: true });
  }));
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

  const tabs = document.getElementById('bottomTabbar');
  const tabItems = Array.from(tabs.querySelectorAll('[data-tab]'));
  const views = Array.from(document.querySelectorAll('main > .view'));
  const reportSection = document.querySelector('.directory-report-mode');
  const chatSection = document.querySelector('.directory-chat-mode');
  let visibleView;
  let idleTimer;
  function updateTab() {
    const route = visibleView?.id.slice(5);
    let selected = route;
    if (route === 'home') {
      const line = document.querySelector('.topbar').getBoundingClientRect().bottom + 36;
      const contains = section => {
        const rect = section.getBoundingClientRect();
        return rect.height > 0 && rect.top <= line && rect.bottom > line;
      };
      if (contains(reportSection)) selected = 'reports';
      else if (contains(chatSection)) selected = 'chat';
    } else if (['newyear','relationship-report','seohwa-report'].includes(route)) selected = 'reports';
    else if (['date-tools','moving','opening','contract'].includes(route)) selected = 'tool';
    else if (route === 'history') selected = 'profile';
    for (const item of tabItems) {
      if (item.dataset.tab === selected) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    }
  }
  function showTabs() {
    clearTimeout(idleTimer);
    delete tabs.dataset.scrolling;
    updateTab();
  }
  function syncTabs() {
    visibleView = views.find(view => view.classList.contains('visible'));
    const route = visibleView?.id;
    const available = !!route && route !== 'view-admin' && route !== 'view-wedding' &&
      !visibleView.matches('.consultation-story-view') && !visibleView.querySelector('.consultation-story-dock') &&
      !(route === 'view-home' && document.documentElement.dataset.homeLayout !== 'directory');
    document.body.classList.toggle('has-service-tabs', available);
    showTabs();
  }
  const routeObserver = new MutationObserver(syncTabs);
  views.forEach(view => routeObserver.observe(view, {attributes:true, attributeFilter:['class']}));
  window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('has-service-tabs')) return;
    tabs.dataset.scrolling = '';
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showTabs, 240);
  }, {passive:true});
  window.addEventListener('pageshow', syncTabs);
  tabs.addEventListener('focusin', showTabs);
  tabItems.forEach(item => item.querySelector('svg').setAttribute('aria-hidden', 'true'));
  syncTabs();

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
