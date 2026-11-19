(() => {
  const params = new URLSearchParams(location.search);
  const naverAd = params.get('nclid') || (params.get('n_media') && params.get('n_ad')) ||
    (params.get('utm_source')?.toLowerCase() === 'naver' && params.get('utm_medium')?.toLowerCase() === 'cpc');
  const consultationLanding = params.get('landing') === 'yeonwoo' ||
    params.has('seo_landing') || location.hash === '#ai-chat' || naverAd;
  document.documentElement.dataset.homeLayout = consultationLanding ? 'consultation' : 'directory';

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
        } else {
          target.type = 'button';
          target.addEventListener('click', () => card.click());
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
    for (const button of document.querySelectorAll('#homeDirectory [data-directory-jump]')) {
      button.addEventListener('click', () => {
        const heading = document.getElementById(button.dataset.directoryJump);
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
    const exampleChoices = [...document.querySelectorAll('#homeDirectory [data-preview-choice]')];
    const examplePanels = [...document.querySelectorAll('#homeDirectory [data-preview-panel]')];
    for (const choice of exampleChoices) {
      choice.addEventListener('click', () => {
        for (const panel of examplePanels) panel.hidden = panel.dataset.previewPanel !== choice.dataset.previewChoice;
        for (const button of exampleChoices) button.setAttribute('aria-pressed', String(button === choice));
      });
    }
    const recent = document.getElementById('directoryRecent');
    if (recent && recent.querySelector && window.accountStore) {
      const button = recent.querySelector('button');
      const question = recent.querySelector('[data-recent-question]');
      const advisor = recent.querySelector('[data-recent-advisor]');
      let selected = null;
      let loadedOwner = null;
      const refresh = () => {
        const owner = window.accountStore.owner();
        const records = owner ? getAiConversationStore() : [];
        const latest = records.filter(rec => rec?.id && Array.isArray(rec.messages) && rec.messages.some(message => message?.role === 'assistant'))
          .sort((a,b) => Number(b.updatedAtMs || 0) - Number(a.updatedAtMs || 0))[0];
        const prompt = latest?.messages.findLast(message => message?.role === 'user')?.content || latest?.title;
        recent.hidden = !latest;
        selected = latest ? {id:latest.id, account:window.accountStore.snapshot()} : null;
        question.textContent = String(prompt || '').slice(0,120);
        advisor.textContent = latest ? (window.TaekilConsultationPersonas?.get(latest.consultantId).name || '연우') + ' 상담' : '';
        if (owner !== loadedOwner) {
          loadedOwner = owner;
          if (owner) syncAiConversationHistoryFromCloud().then(refresh);
        }
      };
      button.addEventListener('click', () => {
        if (selected && window.accountStore.current(selected.account)) resumeAiConversation(selected.id);
      });
      window.addEventListener('taekilso:authChanged', refresh);
      window.addEventListener('taekilso:aiQuestionAccepted', () => queueMicrotask(refresh));
      window.addEventListener('storage', event => {
        if (event.key === null || event.key === window.accountStore.key(AI_CONVERSATION_KEY)) refresh();
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
