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
 const allowed=()=>!reduced.matches&&!connection?.saveData&&!document.hidden;
 const visible=v=>{const s=states.get(v),r=v.getBoundingClientRect();return s.visible&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
 const canPlay=v=>allowed()&&visible(v)&&!(v.classList.contains('ai-chat-bgvideo')&&v.closest('.reading-focus'));
 function pause(v){v.pause();v.classList.remove('yeonwoo-playing');}
 function sync(v){const s=states.get(v);if(s.failed||!canPlay(v)){pause(v);return;}
  if(!v.getAttribute('src')){v.src=v.dataset.videoSrc;v.load();}
  if(s.pending||!v.paused)return;s.pending=true;
  const play=v.play();Promise.resolve(play).then(()=>{s.pending=false;if(!canPlay(v))pause(v);else v.classList.add('yeonwoo-playing');}).catch(()=>{s.pending=false;s.failed=true;pause(v);});
 }
 const all=()=>videos.forEach(sync);
 window.addEventListener('taekilso:readingMode',all);
 const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(e=>{states.get(e.target).visible=e.isIntersecting&&e.intersectionRatio>=.12;sync(e.target);});},{threshold:[0,.12]}):null;
 for(const v of videos){v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.autoplay=false;v.preload='none';v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');states.set(v,{visible:false,failed:false,pending:false});v.addEventListener('error',()=>{states.get(v).failed=true;pause(v);});v.addEventListener('playing',()=>{if(canPlay(v))v.classList.add('yeonwoo-playing');else pause(v);});observer?.observe(v);}
 document.addEventListener('visibilitychange',all);reduced.addEventListener('change',all);connection?.addEventListener?.('change',all);
 const home=document.getElementById('view-home');if(home)new MutationObserver(all).observe(home,{attributes:true,attributeFilter:['class']});
 const setup=document.getElementById('aiChatSetup');if(setup)new MutationObserver(all).observe(setup,{attributes:true,attributeFilter:['style']});
 // Browsers without visibility observation retain the original posters.
})();
