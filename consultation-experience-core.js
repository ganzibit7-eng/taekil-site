(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaekilExperienceCore=api;})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 const normalize=s=>String(s||'').replace(/\s|[?!.,]/g,'');
 function followups(question,reply,history=[]){
  const q=String(question||''),r=String(reply||'');
  const pools={money:['고정지출을 줄일 때 어떤 기준으로 우선순위를 정할까요?','제 수입과 지출 상황을 더 알려드릴게요. 어떤 정보가 필요한가요?','지금 조언을 실천할 지출 점검표로 정리해 주세요.'],career:['현재 직장과 새 제안을 비교할 기준을 정리해 주세요.','업무 조정을 요청할 때 어떻게 이야기하면 좋을까요?','제가 먼저 확인해야 할 근무 조건은 무엇인가요?'],relationship:['상대와 대화를 시작할 때 어떤 말로 꺼내면 좋을까요?','제가 지킬 경계와 조정할 부분을 나눠 주세요.','제 관계 상황을 더 알려드릴게요. 어떤 정보가 필요한가요?'],general:['지금 말씀해 주신 내용을 실천할 순서로 정리해 주세요.','제 상황에 맞추려면 어떤 정보를 더 알려드리면 좋을까요?','선택할 때 먼저 확인할 조건을 정리해 주세요.']};
  const detect=s=>/돈|재물|소득|지출|저축|소비|금전/.test(s)?'money':/이직|직장|업무|회사|사업|진로|연봉/.test(s)?'career':/연애|관계|재회|배우자|가족|상대/.test(s)?'relationship':null;
  const used=new Set(history.filter(m=>m?.role==='user').map(m=>normalize(m.content)));used.add(normalize(q));
  return [...pools[detect(q)||detect(r)||'general'],...pools.general].filter((s,i,a)=>a.indexOf(s)===i&&!used.has(normalize(s))).slice(0,2);
 }
 function hash(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0).toString(36);}
 function parse(raw){try{const x=JSON.parse(raw);return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch(_){return {};}}
 return {followups,hash,parse};
});
