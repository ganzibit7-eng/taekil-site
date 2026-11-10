/* Presentation only: retain the existing inquiry IDs, handlers and storage. */
(()=>{'use strict';const view=document.getElementById('view-support');if(!view)return;
 const container=view.querySelector('.block .container'),email=container.querySelector('.support-email-link'),note=container.querySelector('.support-email-note');
 const web=document.createElement('div');web.className='support-channel-detail';web.hidden=true;
 for(const child of Array.from(container.children))if(child!==email&&child!==note)web.append(child);
 const mail=document.createElement('div');mail.className='support-channel-detail';mail.hidden=true;
 const heading=document.createElement('h2');heading.textContent='이메일로 문의하기';mail.append(heading,email,note);
 const hint=document.createElement('p');hint.className='support-channel-copy';hint.textContent='문의 내용과 함께 답변받을 이메일을 확인해 주세요. 결제 문의라면 결제일과 주문 정보를 함께 알려주시면 확인에 도움이 됩니다. 비밀번호나 카드번호 전체는 보내지 마세요.';mail.append(hint);
 const chooser=document.createElement('div');chooser.className='support-channel-choices';
 const title=view.querySelector('h1'),intro=view.querySelector('.hero-copy');
 function show(which){chooser.hidden=!!which;mail.hidden=which!=='email';web.hidden=which!=='web';title.textContent=which==='email'?'이메일 문의':which==='web'?'홈페이지 문의':'1:1 문의';intro.textContent=which==='email'?'평소 사용하는 메일에서 편하게 문의해 주세요.':which==='web'?'문의와 답변을 내 계정에서 함께 확인할 수 있어요.':'편한 문의 방식을 선택해 주세요. 남겨주신 내용을 확인하고 답변드리겠습니다.';if(which)(which==='email'?mail:web).querySelector('button')?.focus({preventScroll:true});}
 for(const [key,name,copy]of [['email','이메일로 문의하기','contact@taekilso.com으로 보내주세요.'],['web','홈페이지에서 문의하기','로그인 후 문의를 남기고 답변을 확인하세요.']]){
  const b=document.createElement('button');b.type='button';b.className='support-channel-choice';const h=document.createElement('strong'),p=document.createElement('span'),arrow=document.createElement('i');h.textContent=name;p.textContent=copy;arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');b.append(h,p,arrow);b.addEventListener('click',()=>show(key));chooser.append(b);
 }
 for(const panel of [mail,web]){const back=document.createElement('button');back.type='button';back.className='support-channel-back';back.textContent='← 문의 방식 선택';back.addEventListener('click',()=>{show(null);chooser.querySelector('button').focus({preventScroll:true});});panel.prepend(back);}
 container.append(chooser,mail,web);show(null);let visible=view.classList.contains('visible'),nextWeb=false;
 document.addEventListener('click',e=>{if(e.target.closest('[onclick*="requestRefund"]')){nextWeb=true;if(view.classList.contains('visible'))show('web');}},true);
 new MutationObserver(()=>{const next=view.classList.contains('visible');if(next&&!visible){show(nextWeb?'web':null);nextWeb=false;}visible=next;}).observe(view,{attributes:true,attributeFilter:['class']});
})();
