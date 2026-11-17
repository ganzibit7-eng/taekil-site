(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaekilExperienceCore=api;})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 const normalize=s=>String(s||'').replace(/\s|[?!.,]/g,'');
 const specialistFollowups = {
  seohwa:{topic:'relationship',questions:['제 마음을 전하되 상대를 단정하지 않는 첫 문장을 같이 만들어 주세요.','먼저 확인할 관계의 경계를 정리해 주세요.']},
  dogyeom:{topic:'money',questions:['반복 지출과 상황에 따라 새는 돈을 구분할 기준을 알려주세요.','함께 쓰는 돈에서 미리 정할 경계는 무엇인가요?']},
  mujin:{topic:'career',questions:['역할·결정권·협업 조건으로 두 선택지를 비교해 주세요.','결정 전에 직접 확인할 업무 조건을 정리해 주세요.']},
  sodam:{topic:'wedding',questions:['결혼 전에 두 사람이 합의할 생활 기준을 정리해 주세요.','예식 후보를 정하기 전에 어떤 일정이나 비용을 확인하면 좋을까요?']}
 };
 function followups(question,reply,history=[],consultantId){
  const q=String(question||''),r=String(reply||'');
  const pools={money:['고정지출을 줄일 때 어떤 기준으로 우선순위를 정할까요?','제 수입과 지출 상황을 더 알려드릴게요. 어떤 정보가 필요한가요?','지금 조언을 실천할 지출 점검표로 정리해 주세요.'],career:['현재 직장과 새 제안을 비교할 기준을 정리해 주세요.','업무 조정을 요청할 때 어떻게 이야기하면 좋을까요?','제가 먼저 확인해야 할 근무 조건은 무엇인가요?'],relationship:['상대와 대화를 시작할 때 어떤 말로 꺼내면 좋을까요?','제가 지킬 경계와 조정할 부분을 나눠 주세요.','제 관계 상황을 더 알려드릴게요. 어떤 정보가 필요한가요?'],general:['지금 말씀해 주신 내용을 실천할 순서로 정리해 주세요.','제 상황에 맞추려면 어떤 정보를 더 알려드리면 좋을까요?','선택할 때 먼저 확인할 조건을 정리해 주세요.']};
  const detect=s=>/돈|재물|소득|지출|저축|소비|금전/.test(s)?'money':/이직|직장|업무|회사|사업|진로|연봉/.test(s)?'career':/연애|관계|재회|배우자|가족|상대/.test(s)?'relationship':null;
  const used=new Set(history.filter(m=>m?.role==='user').map(m=>normalize(m.content)));used.add(normalize(q));
  const active=detect(q)||detect(r)||'general';
  const specialist=Object.hasOwn(specialistFollowups,consultantId)?specialistFollowups[consultantId]:null;
  const scoped=specialist&&(specialist.topic===active||specialist.topic==='wedding'&&/결혼|택일|예식|결혼식/.test(q))?specialist.questions:[];
  return [...scoped,...pools[active],...pools.general].filter((s,i,a)=>a.indexOf(s)===i&&!used.has(normalize(s))).slice(0,2);
 }
 function hash(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0).toString(36);}
 function parse(raw){try{const x=JSON.parse(raw);return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch(_){return {};}}
 function normalizeEvidence(rows){
  if(!Array.isArray(rows))return [];
  return rows.filter(row=>typeof row?.label==='string'&&typeof row.value==='string')
   .slice(0,14).map(({label,value,scope})=>({
    label:label.slice(0,160),value:value.slice(0,900),scope:typeof scope==='string'?scope.slice(0,240):''
   }));
 }
 return {followups,hash,parse,normalizeEvidence};
});
