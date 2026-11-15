(() => {
  const params = new URLSearchParams(location.search);
  const naverAd = params.get('nclid') || (params.get('n_media') && params.get('n_ad')) ||
    (params.get('utm_source')?.toLowerCase() === 'naver' && params.get('utm_medium')?.toLowerCase() === 'cpc');
  const consultationLanding = params.get('landing') === 'yeonwoo' ||
    params.has('seo_landing') || location.hash === '#ai-chat' || naverAd;
  document.documentElement.dataset.homeLayout = consultationLanding ? 'consultation' : 'directory';

  document.addEventListener('DOMContentLoaded', () => {
    if (consultationLanding) {
      const faq = document.getElementById('homeFaqFold');
      if (faq) faq.open = true;
      return;
    }
    for (const button of document.querySelectorAll('#homeDirectory [data-directory-jump]')) {
      button.addEventListener('click', () => {
        const heading = document.getElementById(button.dataset.directoryJump);
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
    for (const rail of document.querySelectorAll('#homeDirectory :is(.directory-characters, .directory-cards)')) {
      let frame = 0;
      let current = null;
      const markCurrentCard = () => {
        frame = 0;
        let next = null;
        if (rail.clientWidth && rail.scrollWidth - rail.clientWidth > 1) {
          const bounds = rail.getBoundingClientRect();
          let widest = 0;
          for (const card of rail.children) {
            const box = card.getBoundingClientRect();
            const visible = Math.min(bounds.right, box.right) - Math.max(bounds.left, box.left);
            if (visible > widest) {
              widest = visible;
              next = card;
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
