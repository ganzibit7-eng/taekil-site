// Presentation only. Existing consultation, authentication and payment code is untouched.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frames = [...document.querySelectorAll('#homeBrandStory .brand-story-chapter figure')];
  if (reduced.matches || !frames.length || !('IntersectionObserver' in window)) return;
  const active = new Set();
  let scheduled = false;
  const paint = () => {
    scheduled = false;
    if (reduced.matches) return;
    const viewport = window.innerHeight;
    active.forEach(frame => {
      const rect = frame.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (viewport - rect.top) / (viewport + rect.height)));
      frame.style.setProperty('--yeonwoo-shift', `${((.5 - progress) * 18).toFixed(2)}px`);
    });
  };
  const schedule = () => {
    if (!scheduled && active.size && !reduced.matches) {
      scheduled = true;
      window.requestAnimationFrame(paint);
    }
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const frame = entry.target;
      frame.classList.toggle('yeonwoo-in-view', entry.isIntersecting);
      if (entry.isIntersecting) {
        frame.classList.add('yeonwoo-revealed');
        active.add(frame);
      } else active.delete(frame);
    });
    schedule();
  }, { threshold: .12, rootMargin: '0px 0px -24px 0px' });
  frames.forEach(frame => {
    frame.classList.add('yeonwoo-motion-ready');
    observer.observe(frame);
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
})();
