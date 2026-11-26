/* Presentation only. No authentication, consultation, payment or data writes. */
(()=>{'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
 const videos=[],states=new Map();
 for(const name of ['welcome','reading','moonlight']){
  const img=document.querySelector('#homeBrandStory img[src="assets/yeonwoo-'+name+'.jpg"]');if(!img)continue;
  const video=document.createElement('video');video.className='yeonwoo-story-video';video.dataset.videoSrc='assets/yeonwoo-'+name+'.mp4';video.poster=img.getAttribute('src');video.setAttribute('aria-hidden','true');img.parentElement.classList.add('yeonwoo-video-frame');img.after(video);videos.push(video);
 }
 const stage=document.querySelector('video.ai-chat-bgvideo');if(stage)videos.push(stage);
 const entry=document.querySelector('video.ai-chat-entry-media');if(entry)videos.push(entry);
 const setup=document.getElementById('aiChatSetup');
 const stageContainer=stage?.parentElement;
 const stageMedia = [
  {video:stage, phase:'chat', portrait:'ai-consultant-poster.jpg'},
  {video:entry, phase:'entry', portrait:'assets/taekilso-hanok-smile.webp'}
 ].filter(({video})=>video?.previousElementSibling).map(media=>({
  ...media, image:media.video.previousElementSibling, defaultSource:media.video.dataset.videoSrc
 }));
 videos.push(...document.querySelectorAll('[data-home-directory-video], [data-year-progress-video], [data-year-example-video], [data-moving-scene-video], [data-free-progress-video], [data-wedding-preview-video], [data-story-preview-video]'));
 const homeFilm=document.querySelector('[data-home-directory-video]');
 const control=document.querySelector('[data-home-film-control]');
 let manualHomePlay=false;
 function updateControl(){
  if(!control||!homeFilm)return;
  const needsPlay=states.get(homeFilm)?.failed || !observer ||
   (!manualHomePlay && (reduced.matches || connection?.saveData));
  control.hidden=!homeFilm.paused || !needsPlay;
 }
 const allowed=v=>!document.hidden&&((v===homeFilm&&manualHomePlay)||(!reduced.matches&&!connection?.saveData));
 const visible=v=>{const s=states.get(v),r=v.getBoundingClientRect();return s.visible&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
 const canPlay=v=>allowed(v)&&visible(v)&&v.dataset.videoPaused===undefined&&!(v.classList.contains('ai-chat-bgvideo')&&v.closest('.reading-focus'));
 function pause(v){states.get(v).pending=false;v.pause();v.classList.remove('yeonwoo-playing');if(v===homeFilm)updateControl();}
 function sync(v){const s=states.get(v);if(s.failed||!v.dataset.videoSrc||!canPlay(v)){pause(v);return;}
  if(!v.getAttribute('src')){v.src=v.dataset.videoSrc;v.load();}
  if(s.pending||!v.paused)return;
  if(v.ended){v.classList.add('yeonwoo-playing');return;}
  const request=Symbol();s.pending=request;
  const play=v.play();Promise.resolve(play).then(()=>{if(s.pending!==request)return;s.pending=false;if(!canPlay(v))pause(v);else v.classList.add('yeonwoo-playing');}).catch(()=>{if(s.pending!==request)return;s.pending=false;s.failed=true;pause(v);});
 }
 function syncStageMedia(){
  const personas=window.TaekilConsultationPersonas;
  if(!personas)return;
  for(const {video,image,phase,portrait,defaultSource} of stageMedia){
   const persona=phase==='entry' ? personas.forTopic(setup?.style.display==='block'?setup.dataset.entryTopic:undefined) : personas.get(stageContainer?.dataset.chatConsultant);
   const isYeonwoo=persona.id==='yeonwoo';
   const poster=isYeonwoo ? portrait : persona.portrait;
   const source=isYeonwoo ? defaultSource : persona.motion?.[phase] || '';
   if(image.getAttribute('src')!==poster)image.src=poster;
   if(video.getAttribute('poster')!==poster)video.poster=poster;
   if(video.dataset.videoSrc===source)continue;
   const loaded=video.hasAttribute('src');
   pause(video);
   video.dataset.videoSrc=source;
   const state=states.get(video);
   state.failed=false;
   if(loaded){video.removeAttribute('src');video.load();}
  }
 }
 const all=()=>{syncStageMedia();videos.forEach(sync);};
 window.addEventListener('taekilso:readingMode',all);
 const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(e=>{states.get(e.target).visible=e.isIntersecting&&e.intersectionRatio>=.12;sync(e.target);});},{threshold:[0,.12]}):null;
 for(const v of videos){
  v.muted=true;
  v.defaultMuted=true;
  const {storyChoiceVideo,yearExampleVideo,movingSceneVideo,homeOpeningOnce,homeOpeningLoop}=v.dataset;
  v.loop=storyChoiceVideo===undefined&&yearExampleVideo===undefined&&movingSceneVideo===undefined&&homeOpeningOnce===undefined&&!homeOpeningLoop;
  v.playsInline=true;
  v.autoplay=false;
  v.preload='none';
  v.setAttribute('muted','');
  v.setAttribute('playsinline','');
  v.setAttribute('aria-hidden','true');
  states.set(v,{visible:false,failed:false,pending:false});
  v.addEventListener('error',()=>{
   states.get(v).failed=true;
   pause(v);
  });
  v.addEventListener('playing',()=>{
   if(canPlay(v))v.classList.add('yeonwoo-playing');
   else pause(v);
  });
  if(v.dataset.homeOpeningLoop)v.addEventListener('ended',()=>{
   const state=states.get(v);
   state.pending=false;
   v.dataset.videoSrc=v.dataset.homeOpeningLoop;
   v.src=v.dataset.videoSrc;
   v.loop=true;
   v.load();
   sync(v);
  });
  if(!v.loop)v.addEventListener('seeked',()=>sync(v));
  observer?.observe(v);
 }
 if(homeFilm&&control){
  updateControl();
  // WebKit can rewind a muted loop successfully yet leave the player paused.
  // Arm only after a real pass through the film, never on the initial poster.
  let finishingLap=false;
  function resumeAtLoop(){
   if(!finishingLap||!homeFilm.paused||homeFilm.seeking||!canPlay(homeFilm))return;
   if(!homeFilm.ended&&homeFilm.currentTime>.5)return;
   finishingLap=false;
   if(homeFilm.ended)homeFilm.currentTime=0;
   sync(homeFilm);
  }
  homeFilm.addEventListener('timeupdate',()=>{
   if(homeFilm.currentTime>1)finishingLap=homeFilm.duration-homeFilm.currentTime<1;
   else resumeAtLoop();
  });
  for(const event of ['seeked','ended','pause']){
   homeFilm.addEventListener(event,()=>requestAnimationFrame(resumeAtLoop));
  }
  homeFilm.addEventListener('playing',updateControl);
  homeFilm.addEventListener('pause',updateControl);
  homeFilm.addEventListener('error',updateControl);
  control.addEventListener('click',()=>{
   const state=states.get(homeFilm);
   manualHomePlay=true;
   homeFilm.dataset.manualMotion='';
   state.failed=false;
   state.visible=true;
   if(homeFilm.error)homeFilm.load();
   sync(homeFilm);
   updateControl();
  });
  reduced.addEventListener('change',()=>{
   manualHomePlay=false;
   delete homeFilm.dataset.manualMotion;
   sync(homeFilm);
  });
 }
 document.addEventListener('visibilitychange',all);reduced.addEventListener('change',all);connection?.addEventListener?.('change',all);
 const home=document.getElementById('view-home');if(home)new MutationObserver(all).observe(home,{attributes:true,attributeFilter:['class']});
 const newyear=document.getElementById('view-newyear');if(newyear)new MutationObserver(all).observe(newyear,{attributes:true,attributeFilter:['class']});
 if(setup)new MutationObserver(all).observe(setup,{attributes:true,attributeFilter:['style','data-entry-topic']});
 if(stageContainer)new MutationObserver(all).observe(stageContainer,{attributes:true,attributeFilter:['data-chat-consultant']});
 // Browsers without visibility observation retain the original posters.
})();
