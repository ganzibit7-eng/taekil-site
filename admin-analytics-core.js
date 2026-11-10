(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TaekilAnalytics=factory();})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const products={taekilso_premium_30days:'프리미엄 30일',ai_question_pack_5:'질문권 5개',ai_question_pack_10:'질문권 10개'};
  const number=v=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):0;
  const dateKey=ms=>new Date(ms+9*3600000).toISOString().slice(0,10);
  function millis(v){if(v&&typeof v.toMillis==='function')return v.toMillis();if(v&&v.seconds)return v.seconds*1000;if(typeof v==='number')return v;if(typeof v==='string'){const n=Date.parse(v);return Number.isFinite(n)?n:0;}return 0;}
  function orderTime(o){
    const raw=String(o.pay_date||'').replace(/\D/g,'');
    if(raw.length===14){const y=+raw.slice(0,4),m=+raw.slice(4,6),d=+raw.slice(6,8),h=+raw.slice(8,10),mi=+raw.slice(10,12),se=+raw.slice(12,14);if(y>=2020&&m>=1&&m<=12&&d>=1&&d<=31&&h<24&&mi<60&&se<60)return Date.UTC(y,m-1,d,h-9,mi,se);}
    return millis(o.paidAt)||millis(o.createdAt);
  }
  function keys(end,days){const t=Date.parse(end+'T00:00:00+09:00');return Array.from({length:days},(_,i)=>dateKey(t-(days-1-i)*86400000));}
  function aggregate(data,start,end){
    const inRange=k=>k>=start&&k<=end;
    const sum=(rows,key)=>rows.filter(r=>inRange(r.date||r.id)).reduce((n,r)=>n+number(r[key]),0);
    const paid=data.orders.filter(o=>o.status==='paid'&&orderTime(o)&&inRange(dateKey(orderTime(o))));
    const revenue=paid.reduce((n,o)=>n+number(o.amount),0);
    const productRows=Object.keys(products).map(id=>({id,name:products[id],count:paid.filter(o=>o.product===id).length,revenue:paid.filter(o=>o.product===id).reduce((n,o)=>n+number(o.amount),0)}));
    const unknown=paid.filter(o=>!products[o.product]);if(unknown.length)productRows.push({id:'other',name:'기타 상품',count:unknown.length,revenue:unknown.reduce((n,o)=>n+number(o.amount),0)});
    const traffic=['search','sns','direct','other'].map((key,i)=>({name:['검색','SNS','직접','기타'][i],value:sum(data.traffic,key)}));
    const events=['fortuneResults','aiCtaClicks','signups','firstAiAnswers','freeLimitExhausted','purchases'].map((key,i)=>({name:['오늘 운세 결과','연우 CTA 클릭','신규 가입 이벤트','첫 AI 답변','무료 3회 소진','결제 완료 이벤트'][i],value:sum(data.funnel,key)}));
    const reportFields=['freeReportViews','freeReportCompleted','reportCtaClicks','reportQuestionClicks','reportSignupStarts','reportSignups','reportFirstQuestions'];
    const reportEvents=reportFields.map((key,i)=>({name:['무료 기본 결과 확인','결과 하단 도달','연우 CTA 선택','추천 질문 선택','리포트에서 로그인 시작','리포트 유입 신규 가입','이어진 첫 상담 성공'][i],value:sum(data.funnel,key)}));
    const reportInstrumented=data.funnel.some(r=>inRange(r.date||r.id)&&reportFields.some(k=>Object.prototype.hasOwnProperty.call(r,k)));
    const seoMap=new Map();data.seo.filter(r=>inRange(r.date)).forEach(r=>{const id=String(r.slug||'미분류');const row=seoMap.get(id)||{name:id,visits:0,signups:0,answers:0,purchases:0};row.visits+=number(r.visits);row.signups+=number(r.signups);row.answers+=number(r.firstAiAnswers);row.purchases+=number(r.purchases);seoMap.set(id,row);});
    const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
    const series=keys(end,days).map(date=>({date,visits:sum(data.visits.filter(r=>(r.date||r.id)===date),'count'),revenue:paid.filter(o=>dateKey(orderTime(o))===date).reduce((n,o)=>n+number(o.amount),0),orders:paid.filter(o=>dateKey(orderTime(o))===date).length}));
    return {visits:sum(data.visits,'count'),signups:sum(data.funnel,'signups'),paid:paid.length,revenue,aov:paid.length?Math.round(revenue/paid.length):null,products:productRows,traffic,events,reportEvents,reportInstrumented,series,seo:[...seoMap.values()].sort((a,b)=>b.purchases-a.purchases||b.visits-a.visits)};
  }
  function change(current,previous){return previous>0?Math.round((current-previous)/previous*1000)/10:null;}
  function baseline(counters){const count=number(counters.purchases),revenue=number(counters.revenue);return count>=13&&revenue>=33200?{count:count-13,revenue:revenue-33200}:null;}
  return {products,number,dateKey,millis,orderTime,keys,aggregate,change,baseline};
});
