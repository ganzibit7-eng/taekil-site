// Presentation only: keep profile entry and conversation inside one video stage.
(() => {
  const home=document.getElementById('view-home');
  const setup=document.getElementById('aiChatSetup');
  const panel=document.getElementById('aiChatPanel');
  const intro=document.getElementById('homeIntroOverlay');
  const exit=document.getElementById('consultationExit');
  if(!home||!setup||!panel||!intro||!exit)return;
  let opened=false,returnY=0,frame=0;
  const viewport=window.visualViewport;
  function size(){
    frame=0;if(!opened)return;
    const height=viewport?.height||window.innerHeight;
    const offset=viewport?.offsetTop||0;
    const nav=document.querySelector('.topbar');
    const navHeight=nav?Math.min(nav.getBoundingClientRect().height,88):0;
    document.documentElement.style.setProperty('--consult-height',height+'px');
    document.documentElement.style.setProperty('--consult-offset',offset+'px');
    document.documentElement.style.setProperty('--consult-nav',navHeight+'px');
  }
  function resize(){if(!frame)frame=requestAnimationFrame(size);}
  function sync(){
    const next=home.classList.contains('visible')&&(setup.style.display==='block'||panel.style.display==='flex');
    if(next===opened){if(next)resize();return;}
    opened=next;
    document.documentElement.classList.toggle('consultation-open',opened);
    document.body.classList.toggle('consultation-open',opened);
    if(opened){size();window.scrollTo({top:0,left:0,behavior:'instant'});}
    else{
      const input=document.getElementById('aiChatInput');if(document.activeElement===input)input.blur();
      ['--consult-height','--consult-offset','--consult-nav'].forEach(key=>document.documentElement.style.removeProperty(key));
      if(home.classList.contains('visible'))window.scrollTo({top:returnY,left:0,behavior:'instant'});
    }
  }
  function close(){
    setup.style.display='none';panel.style.display='none';intro.style.display='block';
    sync();document.getElementById('homeStartChatBtn')?.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('#homeStartChatBtn,.brand-story-start');
    if(trigger&&!opened)returnY=window.scrollY;
    if(opened&&event.target.closest('.topbar .brand'))close();
  },true);
  exit.addEventListener('click',close);
  new MutationObserver(sync).observe(home,{attributes:true,attributeFilter:['class']});
  const observer=new MutationObserver(sync);
  [setup,panel].forEach(element=>observer.observe(element,{attributes:true,attributeFilter:['style']}));
  window.addEventListener('resize',resize,{passive:true});
  viewport?.addEventListener('resize',resize,{passive:true});
  viewport?.addEventListener('scroll',resize,{passive:true});
  sync();
})();
