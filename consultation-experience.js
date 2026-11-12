/* Reading tools and device-local annotations. Existing account/cloud history remains authoritative. */
(()=>{'use strict';
 const core=window.TaekilExperienceCore,store=window.accountStore;
 const KEY='taekilso_reading_library_v1';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const btn=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
 const read=()=>{const data=core.parse(store.getItem(KEY));data.saved=Array.isArray(data.saved)?data.saved.filter(x=>x&&typeof x.id==='string'&&typeof x.text==='string').slice(0,50):[];if(!data.notes||typeof data.notes!=='object'||Array.isArray(data.notes))data.notes={};if(!data.positions||typeof data.positions!=='object'||Array.isArray(data.positions))data.positions={};return data;};
 const write=data=>{store.setItem(KEY,JSON.stringify(data));return store.getItem(KEY)===JSON.stringify(data);};
 const announce=text=>typeof showToast==='function'&&showToast(text);
 const token=()=>store.snapshot();
 function editNote(container,key,title){
  const captured=token(),label=el('label',title),input=el('textarea');input.maxLength=1000;input.rows=3;input.placeholder='내가 확인한 상황과 앞으로 할 일을 적어두세요.';label.append(input);input.value=read().notes?.[key]||'';
  const status=el('span',null,'reading-muted');status.setAttribute('role','status');
  const save=btn('메모 저장',()=>{if(!store.current(captured)||!captured.owner)return;const data=read();data.notes={...data.notes,[key]:input.value.slice(0,1000)};if(!input.value.trim())delete data.notes[key];status.textContent=write(data)?'이 기기에 저장했어요.':'저장 공간을 확인해 주세요.';});
  const remove=btn('메모 지우기',()=>{if(!store.current(captured)||!captured.owner)return;const data=read();if(data.notes)delete data.notes[key];if(write(data)){input.value='';status.textContent='메모를 지웠어요.';}});
  container.append(label,save,remove,status);
 }
 function decorate(element,text){
  if(!element||!text||element.querySelector('.reading-answer-body'))return;
  const body=el('div',null,'reading-answer-body');while(element.firstChild)body.append(element.firstChild);element.append(body);
  // Use the existing answer, never invent an AI summary or trim its content.
  const boundary=[...body.childNodes].find(n=>n.nodeType===1&&(n.matches?.('.ai-chat-heading,hr')||n.tagName==='BR'));
  if(boundary&&boundary!==body.firstChild){const lead=el('div',null,'reading-answer-lead');while(body.firstChild&&body.firstChild!==boundary)lead.append(body.firstChild);while(body.firstChild?.nodeName==='BR')body.firstChild.remove();body.prepend(lead);}
 }
 function saveControl(element,text){
  if(!element||!text||element.querySelector('.reading-save')||!store.owner())return;
  const captured=token(),conversation=window.__aiConversationId,id=core.hash(conversation+'|'+text);
  const history=window.__aiChatHistory||[],at=history.findIndex(x=>x.role==='assistant'&&x.content===text),question=at>0?history[at-1].content:'';
  const b=btn('',()=>{if(!store.current(captured))return;const data=read(),rows=Array.isArray(data.saved)?data.saved:[],exists=rows.some(x=>x.id===id);data.saved=exists?rows.filter(x=>x.id!==id):[{id,conversation,question:String(question).slice(0,500),text:String(text).slice(0,12000),at:Date.now()},...rows].slice(0,50);if(write(data)){sync();renderLibrary();announce(exists?'저장한 답변에서 해제했어요.':'이 기기의 상담 보관함에 저장했어요.');}else announce('저장 공간을 확인해 주세요.');},'reading-save');
  const sync=()=>{const yes=(read().saved||[]).some(x=>x.id===id);b.textContent=yes?'저장됨 · 해제':'답변 저장';b.setAttribute('aria-pressed',String(yes));};sync();element.append(b);
 }
 const profile=document.querySelector('#view-profile .pf-panels'),library=el('section',null,'reading-library pf-panel');library.id='consultationLibrary';profile?.before(library);
 function renderLibrary(){
  library.replaceChildren(el('h2','연우와 나눈 이야기'));
  if(!store.owner()){library.append(el('p','로그인하면 내 상담 기록을 확인할 수 있어요.'));return;}
  const recent=(typeof getAiConversationStore==='function'?getAiConversationStore():[]).slice().sort((a,b)=>b.updatedAtMs-a.updatedAtMs).slice(0,3);
  library.append(el('p','지난 고민에서, 오늘의 이야기로.','reading-muted'));
  for(const rec of recent){const row=el('div',null,'reading-library-row');row.append(btn(rec.title||'지난 상담 이어가기',()=>resumeAiConversation(rec.id)),el('small',new Date(rec.updatedAtMs).toLocaleDateString('ko-KR')));const note=el('details');note.append(el('summary','내 메모'));editNote(note,'chat:'+rec.id,'상담을 읽고 남기는 내 메모');row.append(note);library.append(row);}
  if(!recent.length)library.append(el('p','첫 상담을 마치면 이곳에서 이어갈 수 있어요.','reading-muted'));
  const links=el('div',null,'reading-library-links');links.append(btn('상담 기록 전체',()=>{goTo('history');switchHistoryTab('ai');}),btn('내 신년 리포트',()=>openNewyearConsultation()));library.append(links);
  const saved=el('details',null,'reading-saved-list');saved.append(el('summary','저장한 답변 '+(read().saved||[]).length+'개'));
  for(const item of read().saved||[]){const row=el('article'),answer=el('div',null,'reading-saved-text'),captured=token();answer.innerHTML=formatAiReply(item.text);row.append(el('h3',item.question||'연우의 답변'),answer,btn('저장 해제',()=>{if(!store.current(captured))return;const data=read();data.saved=(data.saved||[]).filter(x=>x.id!==item.id);write(data);renderLibrary();}));saved.append(row);}library.append(saved,el('p','상담 기록은 기존 계정 보관함과 연결됩니다. 저장한 답변·메모·읽던 위치는 이 브라우저의 현재 계정에만 보관되며, 연우에게 자동 전송되지 않습니다.','reading-muted'));
 }
 if(profile)new MutationObserver(()=>{if(document.getElementById('view-profile').classList.contains('visible')){renderLibrary();syncAiConversationHistoryFromCloud().then(renderLibrary);}}).observe(document.getElementById('view-profile'),{attributes:true,attributeFilter:['class']});
 const panel=document.getElementById('aiChatPanel'),stage=document.querySelector('.ai-chat-stage');
 const toolbar=el('div',null,'reading-toolbar'),focus=btn('읽기에 집중',()=>{const on=!stage.classList.contains('reading-focus');stage.classList.toggle('reading-focus',on);focus.setAttribute('aria-pressed',String(on));focus.textContent=on?'영상과 함께 보기':'읽기에 집중';window.dispatchEvent(new Event('taekilso:readingMode'));});focus.setAttribute('aria-pressed','false');
 let size=17;try{size=Number(localStorage.getItem('taekilso_reading_font'))===19?19:17;}catch(_){}
 const font=btn('글자 크게',()=>{size=size===17?19:17;applyFont();try{localStorage.setItem('taekilso_reading_font',String(size));}catch(_){} });
 function applyFont(){document.documentElement.style.setProperty('--consultation-reading-size',size+'px');font.textContent=size===19?'기본 글자':'글자 크게';font.setAttribute('aria-pressed',String(size===19));}applyFont();toolbar.append(focus,font);panel?.prepend(toolbar);
 function clearFailure(){document.querySelectorAll('.reading-failure').forEach(n=>n.remove());}
 if(panel)new MutationObserver(()=>{if(panel.style.display==='flex')return;stage.classList.remove('reading-focus');focus.setAttribute('aria-pressed','false');focus.textContent='읽기에 집중';window.dispatchEvent(new Event('taekilso:readingMode'));}).observe(panel,{attributes:true,attributeFilter:['style']});
 function failure(message,question){
  clearFailure();const captured=token(),conversation=window.__aiConversationId,box=el('div',null,'ai-chat-msg system-note reading-failure');box.setAttribute('role','status');box.append(el('p',question,'reading-failed-question'),el('p',message));
  box.append(btn('다시 보내기',()=>{if(!store.current(captured)||conversation!==window.__aiConversationId)return;const input=document.getElementById('aiChatInput'),send=document.getElementById('aiChatSendBtn');if(send.disabled)return;if(input.value.trim()&&input.value.trim()!==question){announce('입력 중인 질문이 있어요. 내용을 확인한 뒤 전송해 주세요.');input.focus();return;}input.value=question;input.dispatchEvent(new Event('input',{bubbles:true}));sendAiChatMessage();}));document.getElementById('aiChatWindow')?.append(box);
 }
 function report(content,data,ask){
  if(!store.owner())return;const captured=token(),key='year:'+core.hash(JSON.stringify([data.profile,data.report.overview]));
  const sections=[...content.querySelectorAll(':scope > .newyear-report-section,:scope > .newyear-areas,:scope > .newyear-months')];
  const old=content.querySelector('.newyear-report-contents');if(old)old.remove();
  const nav=el('nav',null,'newyear-report-contents reading-report-nav');nav.setAttribute('aria-label','신년 리포트 목차');
  const jump=i=>{const h=sections[i]?.querySelector('h2');if(h){current=i;interacted=true;save();h.tabIndex=-1;h.focus({preventScroll:true});h.scrollIntoView({block:'start',behavior:'instant'});}};
  sections.forEach((s,i)=>{const title=s.querySelector('h2')?.textContent||'풀이';nav.append(btn(title,()=>jump(i)));if(data.access){s.append(btn('이 부분을 연우에게 물어보기',()=>ask('신년 리포트의 「'+title+'」 내용을 제 상황에 어떻게 적용하면 좋을까요?'),'reading-report-ask'));}});
  const cover=el('header',null,'reading-report-cover');cover.append(el('small','연우가 전하는 한 해의 기록'),el('h1','2027, 나의 한 해'));content.prepend(cover);
  content.querySelector('.newyear-report-owner')?.after(nav);
  const previous=read().positions?.[key];if(Number.isInteger(previous?.section)&&sections[previous.section])nav.prepend(btn('읽던 부분 이어보기',()=>{for(const [i,d]of [...content.querySelectorAll('.newyear-months details')].entries())d.open=(previous.open||[]).includes(i);jump(previous.section);}));
  const note=el('details',null,'reading-report-note');note.append(el('summary','올해의 실천 메모'));editNote(note,key,'내가 선택한 계획');content.append(note,el('p','메모와 읽던 위치는 이 기기에 저장됩니다. 이어 묻기는 질문을 입력창에 준비하며, 전송할 때 현재 상담 이용 한도가 적용됩니다.','reading-muted'));
  let current=previous?.section||0,interacted=false;
  window.__readingReportEvents?.abort();const events=new AbortController();window.__readingReportEvents=events;
  for(const event of ['wheel','touchstart','keydown','pointerdown'])content.addEventListener(event,()=>{interacted=true;},{signal:events.signal,passive:true});
  const save=()=>{if(!store.current(captured))return;const value=read();value.positions={...value.positions,[key]:{section:current,open:[...content.querySelectorAll('.newyear-months details')].flatMap((d,i)=>d.open?[i]:[])}};write(value);};
  window.__readingReportObserver?.disconnect();const observer=new IntersectionObserver(entries=>{if(!document.getElementById('view-newyear').classList.contains('visible')||!interacted)return;for(const e of entries)if(e.isIntersecting){current=sections.indexOf(e.target);save();}},{rootMargin:'-15% 0px -65% 0px'});sections.forEach(s=>observer.observe(s));window.__readingReportObserver=observer;
  content.querySelectorAll('.newyear-months details').forEach(d=>d.addEventListener('toggle',save));
 }
 function removeConversation(id){const data=read();data.saved=(data.saved||[]).filter(x=>x.conversation!==id);if(data.notes)delete data.notes['chat:'+id];write(data);renderLibrary();}
 window.TaekilExperience={decorate,saveControl,failure,clearFailure,report,removeConversation};
 const chatWindow=document.getElementById('aiChatWindow');
 if(chatWindow)new MutationObserver(()=>{const typing=chatWindow.querySelector('.ai-chat-typing');if(!typing||typing.dataset.readingClock)return;typing.dataset.readingClock='true';const started=Date.now(),line=el('small','답변을 작성 중입니다.','reading-muted');typing.append(line);const timer=setInterval(()=>{if(!typing.isConnected){clearInterval(timer);return;}line.textContent='답변 작성 중 · '+Math.floor((Date.now()-started)/1000)+'초 경과';},1000);}).observe(chatWindow,{childList:true});
 window.addEventListener('taekilso:authChanged',()=>{library.replaceChildren();clearFailure();window.__readingReportObserver?.disconnect();renderLibrary();});
 renderLibrary();
})();
