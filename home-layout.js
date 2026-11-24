(() => {
  const params = new URLSearchParams(location.search);
  const naverAd = params.get('nclid') || (params.get('n_media') && params.get('n_ad')) ||
    (params.get('utm_source')?.toLowerCase() === 'naver' && params.get('utm_medium')?.toLowerCase() === 'cpc');
  const consultationLanding = document.documentElement.dataset.shareRoute === 'home' ||
    params.get('landing') === 'yeonwoo' ||
    params.has('seo_landing') || location.hash === '#ai-chat' || naverAd;
  document.documentElement.dataset.homeLayout = consultationLanding ? 'consultation' : 'directory';

  // Keep the first directory paint in its final position while the router loads.
  if (!consultationLanding && location.pathname === '/' && !location.hash && !params.size) {
    document.documentElement.dataset.initialDirectory = '';
    document.addEventListener('DOMContentLoaded', () => { delete document.documentElement.dataset.initialDirectory; });
  }

  function buildTopicIndex(groups) {
    const home = document.getElementById('homeDirectory');
    const index = document.getElementById('view-topics');
    const shortcuts = index.querySelector('.topic-index-shortcuts');
    for (const group of groups) {
      const title = group.querySelector('h2');
      const shortcut = document.createElement('button');
      shortcut.type = 'button';
      shortcut.textContent = title.textContent;
      shortcut.addEventListener('click', () => {
        title.focus({ preventScroll: true });
        title.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
      shortcuts.append(shortcut);

      const list = group.querySelector('ul');
      for (const card of home.querySelectorAll(group.dataset.topicGroup)) {
        const item = document.createElement('li');
        const label = document.createElement('strong');
        const target = document.createElement(card.localName);
        const copy = card.querySelector(':is(.directory-character-copy,.directory-card-copy,.directory-feature-copy)');
        label.textContent = copy?.querySelector('strong').textContent || card.textContent.trim();
        if (card.localName === 'a') {
          target.href = card.getAttribute('href');
          if (card.hasAttribute('data-newyear-preview')) target.setAttribute('data-newyear-preview', '');
          if (card.hasAttribute('data-open-date-comparison')) {
            target.addEventListener('click', event => {
              if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              card.click();
            });
          }
        } else {
          target.type = 'button';
          target.addEventListener('click', () => {
            if (card.hasAttribute('data-directory-chat-start')) {
              if (!window.TaekilPrivacy?.confirmAge()) return;
              goTo('home');
            }
            card.click();
          });
        }
        target.append(label);
        const description = copy?.querySelector('small');
        if (description) {
          const detail = document.createElement('span');
          detail.textContent = description.textContent;
          target.append(detail);
        }
        item.append(target);
        list.append(item);
      }
    }
    new MutationObserver(() => {
      if (index.classList.contains('visible')) document.getElementById('topicIndexTitle').focus({ preventScroll: true });
    }).observe(index, { attributes:true, attributeFilter:['class'] });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const topicGroups = document.querySelectorAll('#view-topics [data-topic-group]');
    if (topicGroups.length) buildTopicIndex(topicGroups);
    if (consultationLanding) {
      const faq = document.getElementById('homeFaqFold');
      if (faq) {
        const target = faq.querySelector('[data-home-faq-list]');
        const source = document.getElementById('faqViewList');
        if (target && source) {
          target.replaceChildren(...Array.from(source.children, item => item.cloneNode(true)));
          target.querySelectorAll('.reveal').forEach(item => item.classList.remove('reveal'));
        }
        faq.open = true;
      }
      if (location.hash === '#uiDemoTitle') {
        // Let initial view routing finish before jumping into the existing story.
        setTimeout(() => document.getElementById('uiDemoTitle')?.scrollIntoView({block:'start', behavior:'instant'}), 0);
      }
      return;
    }
    const exampleChoices = [...document.querySelectorAll('#homeDirectory [data-preview-choice]')];
    const examplePanels = [...document.querySelectorAll('#homeDirectory [data-preview-panel]')];
    for (const choice of exampleChoices) {
      choice.addEventListener('click', () => {
        for (const panel of examplePanels) panel.hidden = panel.dataset.previewPanel !== choice.dataset.previewChoice;
        for (const button of exampleChoices) button.setAttribute('aria-pressed', String(button === choice));
      });
    }
    for (const link of document.querySelectorAll('#homeDirectory [data-banner-topic]')) {
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const topic = link.dataset.bannerTopic;
        let heading;
        if (topic === 'wedding') {
          const title = document.getElementById('directoryWeddingExampleTitle');
          if (!title || typeof goTo !== 'function') return;
          event.preventDefault();
          goTo('wedding');
          heading = title;
        } else {
          const choice = exampleChoices.find(button => button.dataset.previewChoice === topic);
          const panel = choice && document.getElementById(choice.getAttribute('aria-controls'));
          const title = panel?.querySelector('h3');
          if (!title) return;
          event.preventDefault();
          choice.closest('details').open = true;
          choice.click();
          heading = title;
        }
        const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
        // The story's route observer first focuses its introductory heading.
        requestAnimationFrame(() => {
          if (!heading.closest('.view.visible')) return;
          heading.focus({ preventScroll: true });
          heading.scrollIntoView({ block: 'start', behavior });
        });
      });
    }
    const recent = document.getElementById('directoryRecent');
    if (recent && recent.querySelector && window.accountStore) {
      const store = window.accountStore;
      const dismissedKey = 'taekilso_home_recent_hidden_through_v1';
      const button = recent.querySelector('[data-home-consultation]');
      const dismiss = recent.querySelector('.directory-recent-dismiss');
      const question = recent.querySelector('[data-recent-question]');
      const advisor = recent.querySelector('[data-recent-advisor]');
      let selected = null;
      let dismissedThisPage = null;
      let loadedOwner = null;
      const refresh = () => {
        const owner = store.owner();
        const records = owner ? getAiConversationStore() : [];
        const latest = records.filter(rec => rec?.id && Array.isArray(rec.messages) && rec.messages.some(message => message?.role === 'assistant'))
          .sort((a,b) => Number(b.updatedAtMs || 0) - Number(a.updatedAtMs || 0))[0];
        const updatedAt = Number(latest?.updatedAtMs) || 0;
        const hiddenThrough = Math.max(Number(store.getItem(dismissedKey) ?? -1) || 0,
          store.current(dismissedThisPage?.account) ? dismissedThisPage.updatedAt : -1);
        recent.hidden = !latest || updatedAt <= hiddenThrough;
        selected = recent.hidden ? null : {id:latest.id, account:store.snapshot(), updatedAt};
        const prompt = selected && (latest.messages.findLast(message => message?.role === 'user')?.content || latest.title);
        question.textContent = String(prompt || '').slice(0,120);
        advisor.textContent = selected ? (window.TaekilConsultationPersonas?.get(latest.consultantId).name || '연우') + ' 상담' : '';
        if (owner !== loadedOwner) {
          loadedOwner = owner;
          if (owner) syncAiConversationHistoryFromCloud().then(refresh);
        }
      };
      button.addEventListener('click', () => {
        if (selected && store.current(selected.account)) resumeAiConversation(selected.id);
      });
      dismiss?.addEventListener('click', () => {
        if (!selected || !store.current(selected.account)) return;
        dismissedThisPage = selected;
        store.setItem(dismissedKey, String(selected.updatedAt));
        refresh();
        document.getElementById('directoryTopicsTitle')?.focus({preventScroll:true});
      });
      window.addEventListener('taekilso:authChanged', refresh);
      window.addEventListener('taekilso:aiQuestionAccepted', () => queueMicrotask(refresh));
      window.addEventListener('storage', event => {
        if (event.key === null || event.key === store.key(AI_CONVERSATION_KEY) || event.key === store.key(dismissedKey)) refresh();
      });
      new MutationObserver(refresh).observe(document.getElementById('view-home'), {attributes:true, attributeFilter:['class']});
      refresh();
    }
    for (const rail of document.querySelectorAll('#homeDirectory :is(.directory-characters, .directory-cards)')) {
      let frame = 0;
      let current = null;
      const markCurrentCard = () => {
        frame = 0;
        let next = null;
        if (rail.clientWidth && rail.scrollWidth - rail.clientWidth > 1) {
          if (rail.scrollLeft <= 1) {
            next = rail.firstElementChild;
          } else {
            const bounds = rail.getBoundingClientRect();
            const center = (bounds.left + bounds.right) / 2;
            let nearest = Infinity;
            for (const card of rail.children) {
              const box = card.getBoundingClientRect();
              const distance = Math.abs((box.left + box.right) / 2 - center);
              if (distance < nearest) {
                nearest = distance;
                next = card;
              }
            }
          }
        }
        if (next === current) return;
        current?.removeAttribute('data-rail-current');
        next?.setAttribute('data-rail-current', '');
        current = next;
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(markCurrentCard);
      };
      rail.addEventListener('scroll', schedule, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(rail);
      else window.addEventListener('resize', schedule, { passive: true });
      schedule();
    }
  });
})();
