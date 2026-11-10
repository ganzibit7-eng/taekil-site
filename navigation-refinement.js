// Presentation only: keep the footer's policy links clear of the floating chat CTA.
(() => {
  const footer=document.querySelector('footer');
  if(!footer||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    document.body.classList.toggle('footer-in-view',entries.some(entry=>entry.isIntersecting));
  },{threshold:0.01});
  observer.observe(footer);
})();
