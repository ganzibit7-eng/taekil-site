/* Aggregate only. No question, date of birth, name, full URL or referrer query is sent. */
(()=>{
 'use strict';
 const SESSION='taekilso_metrics_session_v1';
 const campaign=window.TaekilCampaignCore.campaignFromUrl(location.href);
 const enabled=()=>window.TaekilMetricsPreference?.enabled()===true;
 function randomId(){
  return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 }
 function sessionId(){
  try{
   const saved=sessionStorage.getItem(SESSION);
   if(/^[a-f0-9]{32}$/.test(saved||''))return saved;
   const id=randomId();sessionStorage.setItem(SESSION,id);return id;
  }catch(_){return randomId();}
 }
 try{localStorage.removeItem('taekilso_campaign_v1');sessionStorage.removeItem('taekilso_preview_funnel_v1');}catch(_){}
 const sent=new Set(),pending=new Set();
 async function post(event,actor){
  const headers={'Content-Type':'application/json'};
  if(actor&&!actor.isAnonymous)headers.Authorization='Bearer '+await actor.getIdToken();
  if(!enabled())return null;
  return fetch(AI_CHAT_URL.replace(/\/ai-chat$/,'/admin-report'),{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers,body:JSON.stringify(event),keepalive:true});
 }
 async function emit(event){
  if(!['taekilso.com','www.taekilso.com'].includes(location.hostname))return;
  await firebaseAuthSettled;if(typeof canRecordVisitorAnalytics!=='function'||!canRecordVisitorAnalytics())return;
  const actor=firebase.auth().currentUser,key=getKstDateKey()+'|'+(actor?.uid||'guest')+'|'+JSON.stringify(event);
  if(sent.has(key)||pending.has(key))return;pending.add(key);
  try{
   const session=event.field==='signups'||event.field==='reportSignups'?randomId():sessionId();
   const response=await post({session,...event},actor);if(!response)return;
   if(response.ok)sent.add(key);else console.warn('방문 집계가 지연되었습니다.',response.status);
  }catch(_){console.warn('방문 집계가 지연되었습니다.');}finally{pending.delete(key);}
 }
 async function activity(field){
  if(!enabled()||!['exampleReads','consultationOpens'].includes(field))return;
  await firebaseAuthSettled;
  if(!canRecordVisitorAnalytics())return;
  const event={kind:'activity',field,eventId:randomId()};
  for(let i=0;i<2&&enabled();i++){
   try{const r=await post(event,null);if(!r || r.status<500)return;}catch(_){}
  }
 }
 window.TaekilCampaign={analytics:()=>enabled()?{seoSlug:typeof getSeoAttribution==='function'?getSeoAttribution()?.slug||'':''}:{disabled:true},emit,activity};
 recordVisit=()=>emit({kind:'visit',channel:detectTrafficSource().channel,...(campaign?{campaign}:{})});
 recordTrafficSource=()=>{}; // Included atomically with the visit; never count twice.
 bumpStat=field=>{if(field==='visits')recordVisit();else if(field==='signups')emit({kind:'funnel',field});};
 bumpDailyFunnel=field=>{if(!['purchases','firstAiAnswers','freeLimitExhausted'].includes(field))emit({kind:'funnel',field});};
 bumpDailySeoLanding=(field,slug)=>{if(['visits','signups'].includes(field)&&TAEKILSO_SEO_GUIDE_SLUGS.has(slug))emit({kind:'seo',field,slug});};
 // Register after auth restoration even if the original script started earlier.
 Promise.resolve(firebaseAuthSettled).then(()=>{recordVisit();const a=getSeoAttribution();if(a)bumpDailySeoLanding('visits',a.slug);});
})();
