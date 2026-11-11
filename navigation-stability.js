// A new view opens at its start without inheriting the previous page's scroll.
// Explicit in-page controls (guides, FAQs, chat history) keep their own behavior.
(() => {
  const views=[...document.querySelectorAll('.view')];
  const home=document.getElementById('view-home');
  const atHomeStart=()=>home?.classList.contains('visible')&&['','#home','#view-home'].includes(location.hash);
  const scrollToStart=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
  if(atHomeStart()){
    // Browser restoration may run after the initial route has already scrolled up.
    if('scrollRestoration' in history)history.scrollRestoration='manual';
    scrollToStart();
  }
  window.addEventListener('pageshow',()=>{
    if(!atHomeStart())return;
    requestAnimationFrame(()=>{if(atHomeStart())scrollToStart();});
  });
  let current=views.find(view=>view.classList.contains('visible'))?.id;
  const observer=new MutationObserver(()=>{
    const next=views.find(view=>view.classList.contains('visible'))?.id;
    if(!next||next===current)return;
    current=next;
    scrollToStart();
  });
  views.forEach(view=>observer.observe(view,{attributes:true,attributeFilter:['class']}));
})();
