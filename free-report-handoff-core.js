(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TaekilReportHandoff=factory();})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const TTL=30*60*1000;
  const events={free_report_viewed:'freeReportViews',free_report_completed:'freeReportCompleted',yeonwoo_cta_clicked:'reportCtaClicks',suggested_question_clicked:'reportQuestionClicks',signup_started_from_report:'reportSignupStarts',signup_completed_from_report:'reportSignups',first_ai_question_sent:'reportFirstQuestions'};
  function profile(input){
    if(!input)return null;
    const {y,m,d}=input;
    if(![y,m,d].every(Number.isInteger)||y<1900||y>new Date().getFullYear()||m<1||m>12||d<1||d>31||!['solar','lunar'].includes(input.calType))return null;
    if(input.calType==='solar'){const date=new Date(Date.UTC(y,m-1,d));if(date.getUTCMonth()!==m-1||date.getUTCDate()!==d)return null;}
    return {name:'나',relation:'본인',y,m,d,calType:input.calType,isLeap:input.calType==='lunar'&&input.isLeap===true,hourValue:'unknown',gender:'unknown'};
  }
  function questions(result){
    const strength=typeof result?.strength==='string'?result.strength.split('·')[0].trim():'';
    return [
      {key:'career',text:strength&&strength.length<20?`제 강점인 ‘${strength}’을 살릴 수 있는 업무 환경은 무엇인가요?`:'제 성향에 맞는 업무와 직업 환경은 무엇인가요?'},
      {key:'money',text:'제 사주에서 돈을 벌고 관리하는 성향은 어떤가요?'},
      {key:'relationships',text:'연애와 인간관계에서는 어떤 점을 살펴보면 좋을까요?'}
    ];
  }
  function pending(value,now,uid){
    if(!value||typeof value.id!=='string'||value.id.length>80||!Number.isFinite(value.createdAt)||now-value.createdAt>TTL||value.createdAt>now+60000||!profile(value.profile)||typeof value.question!=='string'||value.question.length>500||!['awaiting-auth','awaiting-access','handed','cancelled'].includes(value.stage))return null;
    if(value.owner&&value.owner!==uid)return null;
    return {...value,profile:profile(value.profile)};
  }
  const millis=v=>v&&typeof v.toMillis==='function'?v.toMillis():Number(v||0);
  function availability(member,now=Date.now()){
    if(!member)return {kind:'unknown',label:'이용 상태 확인하기',note:'이용 상태를 확인한 뒤 안내해 드릴게요.'};
    if(member.premium===true&&millis(member.premiumUntil)>now)return {kind:'premium',label:'연우에게 이어 묻기',note:'30일 상담 이용 중 · 하루 10개 질문 · 질문은 전송 버튼을 눌러야 시작돼요.'};
    const left=Math.max(0,3-Math.max(0,Number(member.aiFreeUsed)||0));
    if(left)return {kind:'free',label:'연우에게 무료로 질문하기',note:`무료 질문 ${left}개 남음 · 카드 등록 불필요`};
    const credits=Math.max(0,Math.floor(Number(member.aiQuestionCredits)||0));
    if(credits)return {kind:'credits',label:'질문권으로 연우에게 묻기',note:`사용 가능한 질문권 ${credits}개 · 선택만으로 차감되지 않아요.`};
    return {kind:'exhausted',label:'상담 이용권 확인하기',note:'계정의 무료 질문 3회를 모두 사용했어요. 질문권이나 상담 이용권으로 이어갈 수 있어요.'};
  }
  function signupFromReport(p,actor,now=Date.now()){
    const created=Date.parse(actor?.metadata?.creationTime||'');
    return !!(p&&p.startedLoggedOut===true&&p.stage!=='cancelled'&&Number.isFinite(created)&&created>=p.createdAt-5000&&created<=now+60000&&now-p.createdAt<=TTL);
  }
  function matchingProfile(list,p){
    return (Array.isArray(list)?list:[]).find(row=>row&&['y','m','d'].every(k=>Number(row[k])===p[k])&&(row.calType||'solar')===p.calType&&!!row.isLeap===!!p.isLeap&&(row.hourValue||'unknown')==='unknown'&&(row.gender||'unknown')==='unknown'&&(row.relation||'본인')==='본인');
  }
  return {TTL,events,profile,questions,pending,availability,signupFromReport,matchingProfile};
});
