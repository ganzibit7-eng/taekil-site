/* Read-only administrator reporting. No payment, member or entitlement writes. */
(function(){
  'use strict';
  const A=window.TaekilAnalytics,root=document.getElementById('adminAnalytics');if(!A||!root)return;
  const fmt=n=>n==null?'—':Number(n).toLocaleString('ko-KR');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const approvalTime=new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'});
  let data=null,busy=false,request=0,active=false,days=30,metric='visits',asOf=0;
  let reloadAfterRequest=false;
  function syncPaymentTotals(){
    const paid=data?.ok.orders?data.orders.filter(A.settledPaid):null;
    const values={statPurchases:paid?fmt(paid.length):'—',statRevenue:paid?fmt(paid.reduce((n,o)=>n+A.number(o.amount),0))+'원':'—',statPurchasesPremium:paid?fmt(paid.filter(o=>o.product==='taekilso_premium_30days').length):'—',statPurchasesNewyear:paid?fmt(paid.filter(o=>o.product==='taekilso_newyear_2027_report').length):'—',statPurchasesQuestionPacks:paid?fmt(paid.filter(o=>/^ai_question_pack_/.test(o.product)).length):'—'};
    values.funnelPurchase=paid?fmt(paid.filter(o=>A.dateKey(A.orderTime(o))===A.dateKey(Date.now())).length):'—';values.funnelPurchaseRate='주문 기준';
    if(A.dateKey(Date.now())<='2026-11-11'){values.seoPurchases=paid?.length===0?'0':'—';values.seoPurchaseRate='초기화 당일 구분 불가';}
    for(const [id,value]of Object.entries(values)){const e=document.getElementById(id);if(e&&e.textContent!==value)e.textContent=value;}
    if(A.dateKey(Date.now())<='2026-11-11')document.querySelectorAll('#adminSeoLandingRows b').forEach(e=>{if(e.textContent!=='테스트 제외 구분 불가')e.textContent='테스트 제외 구분 불가';});
  }
  const totalsWatch=new MutationObserver(syncPaymentTotals);
  for(const id of ['statPurchases','statRevenue','statPurchasesPremium','statPurchasesQuestionPacks','funnelPurchase','funnelPurchaseRate','seoPurchases','seoPurchaseRate']){const e=document.getElementById(id);if(e)totalsWatch.observe(e,{childList:true,characterData:true,subtree:true});}
  const seoRows=document.getElementById('adminSeoLandingRows');if(seoRows)totalsWatch.observe(seoRows,{childList:true,characterData:true,subtree:true});
  const allowed=()=>typeof isAdmin==='function'&&isAdmin()&&typeof db!=='undefined'&&db&&document.getElementById('view-admin').classList.contains('visible');
  window.toggleAdminTrafficSources=()=>{
    if(!allowed())return;
    const card=document.getElementById('adminTrafficSourceCard');
    const details=document.getElementById('trafficSourceDetails');
    const open=card.getAttribute('aria-expanded')!=='true';
    card.setAttribute('aria-expanded',String(open));
    details.style.display=open?'block':'none';
  };
  const delta=(n,p)=>{const v=A.change(n,p);return v==null?(p===0&&n>0?'이전 기간 기록 0':'비교 기준 없음'):(v>0?'+':'')+v+'% · 이전 동기간 대비';};
  root.innerHTML=`<div class="aa-heading"><div><span class="aa-eyebrow">택일소 운영 분석</span><h2>흐름을 읽는 운영 현황</h2><p>방문부터 상담, 결제까지. 같은 기간의 기록을 함께 살펴보세요.</p></div><button type="button" class="aa-btn" data-aa-refresh>새로고침</button></div><div class="aa-toolbar"><div class="aa-period" role="group" aria-label="통계 기간">${[[1,'오늘'],[7,'최근 7일'],[30,'최근 30일'],[90,'최근 90일']].map(([v,t])=>`<button type="button" data-aa-days="${v}" aria-pressed="${v===30}">${t}</button>`).join('')}</div><button type="button" class="aa-btn" data-aa-export disabled>일별 CSV 내보내기</button></div><p class="aa-status" role="status" aria-live="polite" id="aaStatus">관리자 인증 후 통계를 불러옵니다.</p><div id="aaReport"></div>`;
  function status(text){root.querySelector('#aaStatus').textContent=text;}
  const ratio=(n,d)=>d>0?(100*n/d).toLocaleString('ko-KR',{maximumFractionDigits:1})+'%':'—';
  function bars(rows){const max=Math.max(...rows.map(r=>r.value),1);return rows.map(r=>`<div class="aa-bar-row"><span>${esc(r.name)}</span><strong>${fmt(r.value)}</strong><div class="aa-track"><i style="width:${Math.min(100,r.value/max*100)}%"></i></div></div>`).join('');}
  function table(headers,rows,empty){return `<div class="aa-table-wrap"><table><thead><tr>${headers.map(t=>`<th scope="col">${esc(t)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map((x,i)=>i===0?`<th scope="row">${esc(x)}</th>`:`<td>${esc(x)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="aa-empty">${esc(empty)}</td></tr>`}</tbody></table></div>`;}
  function paymentDetails(rows,available){
    const items=rows.slice(0,50).map(row=>[row.product,approvalTime.format(row.time),row.status,fmt(row.amount)+'원']);
    return `<section class="aa-panel" id="aaPaymentDetails" aria-labelledby="aaPaymentTitle"><h3 id="aaPaymentTitle" tabindex="-1">결제 상세</h3>
      <p>승인 시각은 한국시간이에요. 취소·환불·테스트 주문은 집계에서 제외해요.${rows.length>items.length?' 승인 시각이 최근인 50건을 표시해요.':''}</p>
      ${available?table(['상품','승인 시각','상태','결제 금액'],items,'선택한 기간에 승인된 결제가 없어요.'):'<p class="aa-empty">결제 상세를 불러오지 못했어요. 새로고침으로 다시 확인해 주세요.</p>'}</section>`;
  }
  function dailyActivities(rows,available){
    return `<section class="aa-panel" aria-labelledby="aaActivityTitle"><h3 id="aaActivityTitle">미리보기·상담·가입 일별 건수</h3>
      <p>한국시간 기준입니다. 미리보기는 예시 본문을 절반 이상 1초간 읽은 화면, 상담 시작은 상담 화면을 연 횟수, 신규 가입은 새 회원 가입 건수입니다. 세 항목은 독립적으로 셉니다. 미리보기와 상담 시작은 11월 19일 적용 시점부터 집계됩니다.</p>
      ${available?table(['날짜','미리보기','상담 시작','신규 가입'],rows.map(r=>[r.date,fmt(r.reads),fmt(r.starts),fmt(r.signups)]),'일별 기록이 없습니다.'):'<p class="aa-empty">일별 기록을 불러오지 못했습니다.</p>'}</section>`;
  }
  function chart(series){
    const key=metric,max=Math.max(...series.map(r=>r[key]),1),w=880,h=170,p=14,step=(w-p*2)/Math.max(series.length-1,1);
    const points=series.map((r,i)=>[p+i*step,h-p-r[key]/max*(h-p*2)]);const line=points.map(x=>x.join(',')).join(' ');
    return `<div class="aa-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${metric==='visits'?'방문':'주문 저장 금액'} 일별 추이. 아래 표에서 정확한 값을 확인할 수 있습니다."><line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="#514b48"/><polyline points="${line}" fill="none" stroke="#C6AA76" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${points.length===1?`<circle cx="${points[0][0]}" cy="${points[0][1]}" r="4" fill="#C6AA76"/>`:''}</svg><div class="aa-chart-axis"><span>${series[0].date}</span><span>최대 ${fmt(Math.max(...series.map(r=>r[key])))}${metric==='revenue'?'원':'회'}</span><span>${series.at(-1).date}</span></div></div>`;
  }
  function render(){
    if(!data||!allowed())return;
    syncPaymentTotals();
    const end=A.dateKey(Date.now()),range=A.keys(end,days),start=range[0],prior=A.keys(A.dateKey(Date.parse(start+'T00:00:00+09:00')-86400000),days),r=A.aggregate(data,start,end),p=A.aggregate(data,prior[0],prior.at(-1));
    const paidOK=data.ok.orders,visitsOK=data.ok.visits,funnelOK=data.ok.funnel;
    r.events=r.events.filter(x=>x.name!=='결제 완료 이벤트');r.events.push({name:'테스트 제외 완료 주문',value:r.paid});
    if(start<='2026-11-11')r.seo.forEach(row=>{row.purchases=null;});
    const partial=data.capped?' · 주문 조회 한도에 도달해 일부만 집계됐어요':'';
    status(`${start} — ${end} · 한국시간(KST) · 조회 ${new Date(asOf).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul'})}${partial}${data.errors.length?' · 조회 실패: '+data.errors.join(', ')+' (새로고침으로 재시도)':''}`);
    const kpi=(label,value,note)=>`<article class="aa-kpi"><h3>${label}</h3><strong>${value}</strong><p>${esc(note)}</p></article>`;
    const b=data.ok.orders?{revenue:data.orders.filter(A.settledPaid).reduce((n,o)=>n+A.number(o.amount),0),count:data.orders.filter(A.settledPaid).length}:null;
    const correction=b?`테스트 주문 제외 후 조회된 누적 결제 <b>${fmt(b.revenue)}원 · ${fmt(b.count)}건</b>`:'주문 기록을 불러오지 못했습니다.';
    root.querySelector('#aaReport').innerHTML=`<div class="aa-kpis">${kpi('방문 기록',visitsOK?fmt(r.visits):'—',visitsOK?delta(r.visits,p.visits)+' · 방문 집계 기준':'방문 기록 조회 실패')}${kpi('신규 가입 이벤트',funnelOK?fmt(r.signups):'—',funnelOK?delta(r.signups,p.signups):'행동 기록 조회 실패')}${kpi('완료 주문 저장 금액',paidOK?fmt(r.revenue)+'원':'—',paidOK?'주문에 저장된 금액 · 테스트 제외 · 실제 매출 대조 필요'+(data.capped?' · 부분 집계':''):'주문 원장 조회 실패')}${kpi('완료 주문 / 평균 주문금액',paidOK?fmt(r.paid)+'건':'—',paidOK?'완료 주문당 '+(r.aov==null?'계산할 주문 없음':fmt(r.aov)+'원'):'주문 원장 조회 실패')}</div>
    ${paymentDetails(r.transactions,paidOK)}
    <aside class="aa-baseline"><span class="aa-eyebrow">테스트 매출 구분</span><p>${correction}</p><small>운영자가 테스트로 확인한 2026년 11월 11일 01:36:26 이전 생성 주문을 제외했습니다.</small></aside>
    <section class="aa-panel"><div class="aa-panel-head"><div><h3>일별 흐름</h3><p>같은 축의 일별 기록으로 변화를 확인하세요.</p></div><div class="aa-period" role="group" aria-label="추이 지표"><button type="button" data-aa-metric="visits" aria-pressed="${metric==='visits'}">방문</button><button type="button" data-aa-metric="revenue" aria-pressed="${metric==='revenue'}">주문 저장 금액</button></div></div>${data.ok[metric==='visits'?'visits':'orders']?chart(r.series):'<p class="aa-empty">이 지표를 불러오지 못했습니다.</p>'}<details class="aa-daily"><summary>일별 수치 표 보기</summary>${table(['날짜','방문 기록','완료 주문','주문 저장 금액'],r.series.slice().reverse().map(x=>[x.date,visitsOK?fmt(x.visits):'—',paidOK?fmt(x.orders):'—',paidOK?fmt(x.revenue)+'원':'—']),'해당 기간 기록이 없습니다.')}</details></section>
    <div class="aa-two"><section class="aa-panel"><h3>상품별 결제</h3><p>결제 완료 주문 기준 · 테스트 제외</p>${paidOK?table(['상품','주문','금액'],r.products.map(x=>[x.name,fmt(x.count)+'건',fmt(x.revenue)+'원']),'완료된 주문이 없습니다.'):'<p class="aa-empty">주문 원장을 불러오지 못했습니다.</p>'}</section><section class="aa-panel"><h3>유입 경로 상세</h3><p>${data.ok.traffic?'선택한 기간의 유입 합계 '+fmt(r.trafficTotal)+'건':'검색·SNS·직접 방문 유입'}</p>${data.ok.traffic?table(['경로','유입','비중'],r.trafficChannels.map(row=>[row.name,fmt(row.value)+'건',ratio(row.value,r.trafficTotal)]),'선택한 기간에 집계된 유입이 없어요.'):'<p class="aa-empty">유입 기록을 불러오지 못했습니다.</p>'}</section></div>
    <section class="aa-panel"><h3>광고 캠페인별 방문</h3><p>선택한 기간에 캠페인 링크로 처음 방문한 탭을 한국시간 기준 하루 한 번 집계합니다.</p>${data.ok.campaignVisits?table(['캠페인','방문 수'],r.campaigns.map(row=>[row.campaign,fmt(row.count)+'회']),'선택한 기간에 집계된 캠페인 방문이 없습니다.'):'<p class="aa-empty">캠페인 방문 수를 불러오지 못했습니다.</p>'}</section>
    ${dailyActivities(r.dailyActivities,funnelOK)}
    <section class="aa-panel"><h3>무료 사주와 상품 이용</h3><p>11월 22일 적용 이후의 독립 건수예요. 로그인 시도에는 기존 회원도 포함돼요. 주문은 승인 후 취소·환불되지 않은 건만 셉니다. 결제창 연결 오류는 카드 승인 거절과 구분합니다.</p>
    ${funnelOK?bars([{name:'무료 사주 시작',value:r.basic.start},{name:'무료 결과 열람',value:r.basic.result},{name:'로그인·가입 시도',value:r.basic.login}]):'행동 집계를 불러오지 못했어요.'}
    ${funnelOK?table(['상품','카드','미리보기','구매 선택','결제창 연결','연결 오류','완료 주문','본문 열람'],r.productActivity.map(x=>[x.name,x.cards,x.previews,x.buy,x.checkout,x.openError,paidOK?x.orders:'—',x.read]),'아직 기록이 없어요.') : ''}
    <details><summary>기간 내 건수 비율</summary><p>분모가 0이면 —로 표시해요. 같은 사람을 추적하지 않아 기간 경계와 재열람에 따라 100%를 넘을 수 있어요.</p>
    ${funnelOK?table(['상품','구매 선택 / 미리보기','완료 주문 / 결제창 연결'],r.productActivity.map(x=>[x.name,ratio(x.buy,x.previews),paidOK?ratio(x.orders,x.checkout):'—']),'기록이 없어요.'):''}</details>
    <details><summary>상담사별 카드 선택</summary>${funnelOK&&r.cards.length?bars(r.cards):'표시할 기록이 없어요.'}</details></section>
    <section class="aa-panel"><h3>상담과 구매로 이어지는 주요 행동</h3><p>각 항목은 기간 내 독립적인 이벤트 건수입니다. 같은 이용자의 순서나 이동을 추적한 전환율이 아니며, 항목 간 차이를 이탈률로 해석하지 않습니다.</p>${funnelOK?bars(r.events):'<p class="aa-empty">행동 기록을 불러오지 못했습니다.</p>'}</section>
    <section class="aa-panel"><h3>무료 기본 리포트에서 연우로</h3><p>이 경로에서 발생한 단계별 기록입니다. 같은 브라우저의 결과 흐름당 각 단계는 한 번만 기록합니다. 가입은 신규 계정만, 첫 상담은 해당 흐름에서 실제 답변을 받은 첫 질문만 셉니다. 기기 간 이용자 추적이나 동일 기간 코호트 전환율은 아닙니다.</p>${!funnelOK?'<p class="aa-empty">행동 기록을 불러오지 못했습니다.</p>':r.reportInstrumented?bars(r.reportEvents):'<p class="aa-empty">선택 기간에 무료 리포트 전환 기록이 없습니다. 신규 집계 필드 수집은 관련 화면과 Firestore 규칙을 함께 적용한 뒤 시작됩니다.</p>'}</section>
    <section class="aa-panel"><h3>검색 가이드 성과</h3><p>가이드에서 상담으로 이어진 기록 · 결제 이벤트, 주문 원장과 집계 기준이 다를 수 있습니다.</p>${data.ok.seo?table(['가이드','상담 유입','가입','첫 답변','결제 이벤트'],r.seo.slice(0,20).map(x=>['/'+x.name+'/',fmt(x.visits),fmt(x.signups),fmt(x.answers),fmt(x.purchases)]),'선택한 기간에 검색 가이드 유입 기록이 없습니다.'):'<p class="aa-empty">검색 가이드 기록을 불러오지 못했습니다.</p>'}${data.seoCapped?'<p>검색 가이드 기록은 최대 2,000개 문서 범위의 부분 집계입니다.</p>':''}</section>
    <details class="aa-definitions"><summary>집계 기준과 데이터 범위</summary><p>기록이 없는 날짜는 조회가 성공하면 0으로 표시해요. 비교는 직전 동일 일수 기준이며 오늘 집계는 한국시간 자정에 바뀌어요.</p><p>결제는 승인 기록을 기준으로 집계해요. 과거 주문에 승인 시각이 없으면 저장된 결제일이나 주문 생성일을 사용해요. 부분환불도 주문 금액 합계에서 제외하며 수수료는 반영되지 않아요.</p><p>주문 생성일 형식 2종과 승인 시각 기준으로 각각 최대 1,000건을 읽고 중복을 제거해요. 가이드 기록은 최대 2,000건이에요. CSV에는 선택 기간의 일별 합계를 담아요.</p></details>`;
    root.querySelector('[data-aa-export]').disabled=!(visitsOK||paidOK);
  }
  async function loadOrders(first){
    const limit=1000,orders=db.collection('paymentOrders');
    const recent=query=>query.limit(limit+1).get({source:'server'});
    const snapshots=await Promise.all([
      recent(orders.orderBy('createdAt','desc')),
      recent(orders.orderBy('createdAtMs','desc')),
      recent(orders.where('paidAtMs','>=',Date.parse(first+'T00:00:00+09:00')).orderBy('paidAtMs','desc'))
    ]);
    return A.mergeOrderSnapshots(snapshots,limit);
  }
  window.addEventListener('taekilso:paymentSummaryChanged',()=>{
    if(!allowed())return;
    if(busy)reloadAfterRequest=true;else load();
  });
  document.querySelector('[data-aa-payment-details]').addEventListener('click',()=>{
    if(!allowed())return;
    root.querySelector('[data-aa-days="1"]').click();
    const target=root.querySelector('#aaPaymentTitle')||root.querySelector('#aaStatus');
    target.scrollIntoView({block:'start'});
    target.focus({preventScroll:true});
  });
  async function load(){
    if(!allowed()||busy)return;busy=true;const token=++request;const button=root.querySelector('[data-aa-refresh]');button.disabled=true;status('기록을 불러오는 중입니다…');
    const first=A.keys(A.dateKey(Date.now()),180)[0];
    const daily=name=>{
      const field=firebase.firestore.FieldPath.documentId();
      return db.collection(name).where(field,'>=',first).where(field,'<=',A.dateKey(Date.now())).get({source:'server'});
    };
    const seoReport=async()=>{
      const token=await firebaseAuthUser.getIdToken();
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),20000);
      let response;
      try {
        response=await fetch('https://taekilso-api-jhqz3vlila-du.a.run.app/api/admin-report?start='+first+'&end='+A.dateKey(Date.now()),{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:controller.signal});
      } finally { clearTimeout(timeout); }
      if(!response.ok)throw Object.assign(new Error('REPORT_UNAVAILABLE'),{code:response.status===401||response.status===403?'permission-denied':'unavailable'});
      const body=await response.json();if(!Array.isArray(body.rows)||body.rows.length>2000)throw new Error('INVALID_REPORT');
      return {docs:body.rows.map(row=>({id:row.date+'__'+row.slug,data:()=>row})),capped:!!body.capped};
    };
    const jobs=[['visits','방문',()=>daily('dailyVisits')],['funnel','행동',()=>daily('dailyFunnel')],['traffic','유입',()=>daily('dailyTrafficSources')],['campaignVisits','광고 캠페인',()=>db.collection('dailyCampaignVisits').where('date','>=',first).where('date','<=',A.dateKey(Date.now())).get({source:'server'})],['seo','검색 가이드',seoReport],['orders','주문',()=>loadOrders(first)]];
    try{
      let completed=0;
      const results=await Promise.allSettled(jobs.map(([, ,run])=>new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Object.assign(new Error('REPORT_TIMEOUT'),{code:'unavailable'})),20000);
        Promise.resolve().then(run).then(resolve,reject).finally(()=>clearTimeout(timer));
      }).finally(()=>{
        completed++;
        if(token===request&&allowed()&&completed<jobs.length)status('통계를 확인하고 있어요. '+completed+' / '+jobs.length);
      })));
      if(token!==request||!allowed())return;
      const next={ok:{},errors:[],orders:[],visits:[],funnel:[],traffic:[],campaignVisits:[],seo:[]};
      results.forEach((result,i)=>{const [key,label]=jobs[i];next.ok[key]=result.status==='fulfilled';if(result.status==='rejected'){const reason={'permission-denied':'조회 권한 확인 필요','failed-precondition':'조회 인덱스 확인 필요','unavailable':'연결 상태 확인 필요'}[result.reason?.code]||'조회 오류';next.errors.push(label+' · '+reason);return;}const snap=result.value;next[key]=snap.docs.map(doc=>({...doc.data(),id:doc.id}));if(key==='seo')next.seoCapped=!!snap.capped;if(key==='orders')next.capped=!!snap.capped;});
      next.orders=next.orders.filter(window.TaekilPaymentBaseline.isProductionOrder);data=next;asOf=Date.now();render();
    }catch(e){if(token===request&&allowed())status('통계를 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요.');}
    finally{
      if(token===request){
        busy=false;button.disabled=false;
        if(reloadAfterRequest){reloadAfterRequest=false;load();}
      }
    }
  }
  root.addEventListener('click',event=>{
    const btn=event.target.closest('button');if(!btn||!allowed())return;
    if(btn.hasAttribute('data-aa-refresh'))load();
    if(btn.dataset.aaDays){days=Number(btn.dataset.aaDays);root.querySelectorAll('[data-aa-days]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));render();}
    if(btn.dataset.aaMetric){metric=btn.dataset.aaMetric;render();}
    if(btn.hasAttribute('data-aa-export')&&data){
      const end=A.dateKey(Date.now()),r=A.aggregate(data,A.keys(end,days)[0],end),safe=v=>`"${String(v).replace(/"/g,'""')}"`;
      const csv='\uFEFF'+[['날짜(KST)','방문 기록','완료 주문(테스트 제외)','주문 저장 금액(실제 매출 대조 필요)'],...r.series.map(x=>[x.date,data.ok.visits?x.visits:'조회 실패',data.ok.orders?x.orders:'조회 실패',data.ok.orders?x.revenue:'조회 실패'])].map(row=>row.map(safe).join(',')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`taekilso-analytics-${end}-${days}days${data.capped?'-partial':''}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  });
  const entryMessage=document.getElementById('adminEntryMessage');
  const retryEntry=document.getElementById('adminEntryRetry');
  let entryTimer=null;
  function updateEntry(visible){
    clearTimeout(entryTimer);
    if(!visible||allowed())return;
    const restoring=typeof firebaseAuthReady==='undefined'||!firebaseAuthReady;
    entryMessage.textContent=restoring?'관리자 로그인 상태를 확인하고 있어요.':'관리자 계정으로 로그인해야 볼 수 있어요.';
    retryEntry.hidden=!restoring;
    if(restoring)entryTimer=setTimeout(()=>{
      entryMessage.textContent='로그인 연결이 늦어지고 있어요. 다시 연결해 주세요.';
    },8000);
  }
  retryEntry.addEventListener('click',()=>location.reload());
  function sync(){
    const adminVisible=document.getElementById('view-admin').classList.contains('visible');
    document.body.classList.toggle('admin-exclusive-mode',adminVisible);
    document.documentElement.classList.toggle('admin-exclusive-mode',adminVisible);
    if(typeof window.syncAdminExclusiveMode==='function')window.syncAdminExclusiveMode();
    const visible=!!allowed(),content=document.getElementById('adminContent');
    // A direct #admin load can finish routing before the saved login is restored.
    // Re-render the existing admin view after its navigation reflects the settled login.
    if(visible&&(content.style.display==='none'||!window.accountStore.current(window.__adminViewToken))&&typeof renderAdmin==='function')renderAdmin();
    if(adminVisible&&content.style.display!=='none'&&typeof isAdmin==='function'&&!isAdmin()&&typeof renderAdmin==='function')renderAdmin();
    updateEntry(adminVisible);
    root.hidden=!visible;if(visible&&!active){active=true;load();}if(!visible&&active){active=false;busy=false;reloadAfterRequest=false;++request;data=null;root.querySelector('#aaReport').replaceChildren();root.querySelector('[data-aa-export]').disabled=true;}
  }
  new MutationObserver(sync).observe(document.getElementById('view-admin'),{attributes:true,attributeFilter:['class','style']});
  new MutationObserver(sync).observe(document.getElementById('adminContent'),{attributes:true,attributeFilter:['style']});
  const nav=document.getElementById('authNavBtn');if(nav)new MutationObserver(sync).observe(nav,{childList:true,subtree:true});
  let analyticsOwner=window.accountStore?.owner();
  window.addEventListener('taekilso:authChanged',event=>{if(analyticsOwner!==event.detail?.owner){analyticsOwner=event.detail?.owner;active=false;busy=false;reloadAfterRequest=false;++request;data=null;root.querySelector('#aaReport').replaceChildren();}sync();});
  function resume(){
    const alreadyActive=active;
    sync();
    if(alreadyActive&&allowed()&&Date.now()-asOf>300000)load();
  }
  window.addEventListener('pageshow',resume);
  window.addEventListener('online',resume);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});
  sync();
})();
