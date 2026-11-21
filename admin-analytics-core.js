(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TaekilAnalytics=factory();})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const products={taekilso_premium_30days:'프리미엄 30일',taekilso_newyear_2027_report:'2027 신년운세',ai_question_pack_5:'질문권 5개',ai_question_pack_10:'질문권 10개'};
  const reportProducts = {"love": ["taekilso_seohwa_story_report", "서화 · 연애"], "wealth": ["taekilso_dogyeom_story_report", "도겸 · 재물"], "reunion": ["taekilso_ijun_story_report", "이준 · 재회"], "career": ["taekilso_mujin_story_report", "무진 · 직업"], "newyear": ["taekilso_newyear_2027_report", "연우 · 신년"], "date": ["taekilso_date_report", "정밀 택일"], "relationship": ["taekilso_relationship_report", "두 사람 관계"]};
  for (const [id,name] of Object.values(reportProducts)) products[id] ??= name;
  const number=v=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):0;
  function settledPaid(o){
    if(!o||o.status!=='paid'||number(o.refundedAmount)||o.cancelledAtMs||o.entitlementRevokedAtMs)return false;
    if(o.pay_state!=null&&Number(o.pay_state)!==4)return false;
    if(o.lastPayState!=null&&![0,1,4,10].includes(Number(o.lastPayState)))return false;
    return true;
  }
  const dateKey=ms=>new Date(ms+9*3600000).toISOString().slice(0,10);
  function millis(v){if(v&&typeof v.toMillis==='function')return v.toMillis();if(v&&v.seconds)return v.seconds*1000;if(typeof v==='number')return v;if(typeof v==='string'){const n=Date.parse(v);return Number.isFinite(n)?n:0;}return 0;}
  function orderTime(o){
    const approved=millis(o.paidAtMs)||millis(o.paidAt);
    if(approved)return approved;
    const raw=String(o.pay_date||'').replace(/\D/g,'');
    if(raw.length===14){const y=+raw.slice(0,4),m=+raw.slice(4,6),d=+raw.slice(6,8),h=+raw.slice(8,10),mi=+raw.slice(10,12),se=+raw.slice(12,14);if(y>=2020&&m>=1&&m<=12&&d>=1&&d<=31&&h<24&&mi<60&&se<60){const value=Date.UTC(y,m-1,d,h-9,mi,se);if(new Date(value+9*3600000).toISOString().slice(0,10)===`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`)return value;}}
    return millis(o.createdAtMs)||millis(o.createdAt);
  }
  function keys(end,days){const t=Date.parse(end+'T00:00:00+09:00');return Array.from({length:days},(_,i)=>dateKey(t-(days-1-i)*86400000));}
  function aggregate(data,start,end){
    const inRange=k=>k>=start&&k<=end;
    const sum=(rows,key)=>rows.filter(r=>inRange(r.date||r.id)).reduce((n,r)=>n+number(r[key]),0);
    const paid=data.orders.filter(o=>settledPaid(o)&&orderTime(o)&&inRange(dateKey(orderTime(o))));
    const campaignMap=new Map();
    for (const row of data.campaignVisits || []) {
      if (!inRange(row.date)) continue;
      campaignMap.set(row.campaign,(campaignMap.get(row.campaign) || 0) + number(row.count));
    }
    const campaigns = Array.from(campaignMap, ([campaign,count]) => ({campaign,count}))
      .sort((a,b) => b.count - a.count || a.campaign.localeCompare(b.campaign,'ko'));
    const revenue=paid.reduce((n,o)=>n+number(o.amount),0);
    const productRows=Object.keys(products).map(id=>({id,name:products[id],count:paid.filter(o=>o.product===id).length,revenue:paid.filter(o=>o.product===id).reduce((n,o)=>n+number(o.amount),0)}));
    const unknown=paid.filter(o=>!products[o.product]);if(unknown.length)productRows.push({id:'other',name:'기타 상품',count:unknown.length,revenue:unknown.reduce((n,o)=>n+number(o.amount),0)});
    const traffic=['search','sns','direct','other'].map((key,i)=>({name:['검색','SNS','직접','기타'][i],value:sum(data.traffic,key)}));
    const events=['fortuneResults','aiCtaClicks','signups','firstAiAnswers','freeLimitExhausted','purchases'].map((key,i)=>({name:['오늘 운세 결과','연우 CTA 클릭','신규 가입 이벤트','첫 AI 답변','무료 3회 소진','결제 완료 이벤트'][i],value:sum(data.funnel,key)}));
    const reportFields=['freeReportViews','freeReportCompleted','reportCtaClicks','reportQuestionClicks','reportSignupStarts','reportSignups','reportFirstQuestions'];
    const reportEvents=reportFields.map((key,i)=>({name:['무료 기본 결과 확인','결과 하단 도달','연우 CTA 선택','추천 질문 선택','리포트에서 로그인 시작','리포트 유입 신규 가입','이어진 첫 상담 성공'][i],value:sum(data.funnel,key)}));
    const reportInstrumented=data.funnel.some(r=>inRange(r.date||r.id)&&reportFields.some(k=>Object.prototype.hasOwnProperty.call(r,k)));
    const dailyActivities=keys(end,Math.round((Date.parse(end)-Date.parse(start))/86400000)+1).reverse().map(date=>{
      const rows=data.funnel.filter(r=>(r.date||r.id)===date);
      return {date, reads:date<'2026-11-19'?null:sum(rows,'exampleReads'), starts:date<'2026-11-19'?null:sum(rows,'consultationOpens'), signups:sum(rows,'signups')};
    });
    const seoMap=new Map();data.seo.filter(r=>inRange(r.date)).forEach(r=>{const id=String(r.slug||'미분류');const row=seoMap.get(id)||{name:id,visits:0,signups:0,answers:0,purchases:0};row.visits+=number(r.visits);row.signups+=number(r.signups);row.answers+=number(r.firstAiAnswers);row.purchases+=number(r.purchases);seoMap.set(id,row);});
    const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
    const series=keys(end,days).map(date=>({date,visits:sum(data.visits.filter(r=>(r.date||r.id)===date),'count'),revenue:paid.filter(o=>dateKey(orderTime(o))===date).reduce((n,o)=>n+number(o.amount),0),orders:paid.filter(o=>dateKey(orderTime(o))===date).length}));
    const productActivity=Object.entries(reportProducts).map(([topic,[id,name]])=>{
      const count=field=>sum(data.funnel,field+'_'+topic);
      return {name,cards:count('card'),previews:count('preview'),buy:count('buy'),checkout:count('checkout'),openError:count('openError'),read:count('read'),orders:paid.filter(o=>o.product===id).length};
    });
    const cards=Object.entries({"love": "서화의 연애·관계 리포트", "wealth": "도겸의 재물운 리포트", "career": "무진의 직업·이직 리포트", "wedding": "소담의 결혼·택일 상담", "first-date": "하린의 새로운 만남 상담", "reunion": "이준의 재회운 리포트", "marriage": "연서의 결혼을 앞두고 상담", "career-start": "해온의 취업·진로 상담", "side-job": "태율의 창업·부업 상담", "saving": "다온의 소비·저축 상담", "career-growth": "시현의 승진·역할 변화 상담", "study-routine": "여울의 공부 습관 상담", "exam-planning": "서진의 시험·자격증 상담", "major-choice": "윤슬의 전공·진학 상담", "new-learning": "지안의 새 기술 배우기 상담", "first-home": "모은의 독립·첫 살림 상담", "family-boundaries": "이솔의 가족과 거리 상담", "work-rest": "유현의 일과 쉼 상담", "friendships": "소율의 친구·모임 상담", "move-planning": "담원의 이사 준비 상담", "opening-plan": "기윤의 개업 계획 상담", "contract-prep": "정온의 계약 전 점검 상담", "yeonwoo": "연우의 AI 사주 상담", "newyear": "2027 신년 리포트"}).map(([key,name])=>({name,value:sum(data.funnel,'card_'+key)})).filter(x=>x.value);
    const basic={start:sum(data.funnel,'homeBasicStart'),result:sum(data.funnel,'basicResult'),login:sum(data.funnel,'loginStart')};
    return {basic,cards,productActivity,visits:sum(data.visits,'count'),signups:sum(data.funnel,'signups'),paid:paid.length,revenue,aov:paid.length?Math.round(revenue/paid.length):null,products:productRows,campaigns,traffic,events,reportEvents,reportInstrumented,dailyActivities,series,seo:[...seoMap.values()].sort((a,b)=>b.purchases-a.purchases||b.visits-a.visits)};
  }
  function change(current,previous){return previous>0?Math.round((current-previous)/previous*1000)/10:null;}
  function baseline(counters){const count=number(counters.purchases),revenue=number(counters.revenue);return count>=13&&revenue>=33200?{count:count-13,revenue:revenue-33200}:null;}
  return {products,number,settledPaid,dateKey,millis,orderTime,keys,aggregate,change,baseline};
});
