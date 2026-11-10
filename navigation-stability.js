// A new view opens at its start without inheriting the previous page's scroll.
// Explicit in-page controls (guides, FAQs, chat history) keep their own behavior.
(() => {
  const views=[...document.querySelectorAll('.view')];
  let current=views.find(view=>view.classList.contains('visible'))?.id;
  const observer=new MutationObserver(()=>{
    const next=views.find(view=>view.classList.contains('visible'))?.id;
    if(!next||next===current)return;
    current=next;
    window.scrollTo({top:0,left:0,behavior:'instant'});
  });
  views.forEach(view=>observer.observe(view,{attributes:true,attributeFilter:['class']}));
})();
