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
  });
})();
