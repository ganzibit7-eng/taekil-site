(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaekilCampaignCore=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const clean=(v,max=80)=>String(v||'').replace(/[^\p{L}\p{N}_. -]/gu,'').trim().slice(0,max);
 function capture(url,referrer,now=Date.now()){
  const u=new URL(url),p=u.searchParams;let ref='';try{ref=new URL(referrer).hostname.replace(/^www\./,'');}catch(_){}
  const external=ref&&ref!==u.hostname.replace(/^www\./,'');
  const source=clean(p.get('utm_source'))||(external?clean(ref):'direct');
  return {version:1,source,medium:clean(p.get('utm_medium'))||(external?'referral':'none'),campaign:clean(p.get('utm_campaign')),content:clean(p.get('utm_content')),landingPath:u.pathname.replace(/[^a-zA-Z0-9/_-]/g,'').slice(0,160)||'/',capturedAtMs:now};
 }
 function valid(v,now=Date.now()){return !!v&&v.version===1&&Number.isFinite(v.capturedAtMs)&&v.capturedAtMs<=now+60000&&now-v.capturedAtMs<=30*86400000&&['source','medium','campaign','content'].every(k=>typeof v[k]==='string'&&v[k]===clean(v[k]))&&typeof v.landingPath==='string'&&/^\/[a-zA-Z0-9/_-]{0,159}$/.test(v.landingPath);}
 function select(previous,current,now=Date.now()){return valid(previous,now)&&current.source==='direct'?previous:current;}
 return {capture,valid,select};
});
