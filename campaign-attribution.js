/* Aggregate only. No question, date of birth, name, full URL or referrer query is sent. */
(()=>{
 'use strict';
 const C=window.TaekilCampaignCore,KEY='taekilso_campaign_v1',SESSION='taekilso_metrics_session_v1';if(!C)return;
 let attribution=C.capture(location.href,document.referrer),session;
 try{attribution=C.select(JSON.parse(localStorage.getItem(KEY)||'null'),attribution);localStorage.setItem(KEY,JSON.stringify(attribution));session=sessionStorage.getItem(SESSION);}catch(_){}
 if(!/^[a-f0-9]{32}$/.test(session||'')){const b=new Uint8Array(16);crypto.getRandomValues(b);session=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');try{sessionStorage.setItem(SESSION,session);}catch(_){}}
 const sent=new Set(),pending=new Set();
 async function emit(event){
  if(!['taekilso.com','www.taekilso.com'].includes(location.hostname))return;
  await firebaseAuthSettled;if(typeof canRecordVisitorAnalytics!=='function'||!canRecordVisitorAnalytics())return;
  const actor=firebase.auth().currentUser,key=getKstDateKey()+'|'+(actor?.uid||'guest')+'|'+JSON.stringify(event);
  if(sent.has(key)||pending.has(key))return;pending.add(key);
  try{
   const headers={'Content-Type':'application/json'};if(actor&&!actor.isAnonymous)headers.Authorization='Bearer '+await actor.getIdToken();
   const response=await fetch(AI_CHAT_URL.replace(/\/ai-chat$/,'/admin-report'),{method:'POST',headers,body:JSON.stringify({session,...event}),keepalive:true});
   if(response.ok)sent.add(key);else console.warn('방문 집계가 지연되었습니다.',response.status);
  }catch(_){console.warn('방문 집계가 지연되었습니다.');}finally{pending.delete(key);}
 }
 window.TaekilCampaign={order:()=>C.valid(attribution)?{...attribution}:C.capture(location.href,''),analytics:()=>({seoSlug:typeof getSeoAttribution==='function'?getSeoAttribution()?.slug||'':''}),emit};
 recordVisit=()=>emit({kind:'visit',channel:detectTrafficSource().channel});
 recordTrafficSource=()=>{}; // Included atomically with the visit; never count twice.
 bumpStat=field=>{if(field==='visits')recordVisit();else if(field==='signups')emit({kind:'funnel',field});};
 bumpDailyFunnel=field=>{if(!['purchases','firstAiAnswers','freeLimitExhausted'].includes(field))emit({kind:'funnel',field});};
 bumpDailySeoLanding=(field,slug)=>{if(['visits','signups'].includes(field)&&TAEKILSO_SEO_GUIDE_SLUGS.has(slug))emit({kind:'seo',field,slug});};
 // Register after auth restoration even if the original script started earlier.
 Promise.resolve(firebaseAuthSettled).then(()=>{recordVisit();const a=getSeoAttribution();if(a)bumpDailySeoLanding('visits',a.slug);});
})();
