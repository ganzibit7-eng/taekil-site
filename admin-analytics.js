/* Read-only administrator reporting. No payment, member or entitlement writes. */
(function(){
  'use strict';
  const A=window.TaekilAnalytics,root=document.getElementById('adminAnalytics');if(!A||!root)return;
  const fmt=n=>n==null?'—':Number(n).toLocaleString('ko-KR');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data=null,busy=false,request=0,active=false,days=30,metric='visits',asOf=0;
  const allowed=()=>typeof isAdmin==='function'&&isAdmin()&&typeof db!=='undefined'&&db&&document.getElementById('view-admin').classList.contains('visible');
  const delta=(n,p)=>{const v=A.change(n,p);return v==null?(p===0&&n>0?'이전 기간 기록 0':'비교 기준 없음'):(v>0?'+':'')+v+'% · 이전 동기간 대비';};
  root.innerHTML=`<div class="aa-heading"><div><span class="aa-eyebrow">택일소 운영 분석</span><h2>흐름을 읽는 운영 현황</h2><p>방문부터 상담, 결제까지. 같은 기간의 기록을 함께 살펴보세요.</p></div><button type="button" class="aa-btn" data-aa-refresh>새로고침</button></div><div class="aa-toolbar"><div class="aa-period" role="group" aria-label="통계 기간">${[[1,'오늘'],[7,'최근 7일'],[30,'최근 30일'],[90,'최근 90일']].map(([v,t])=>`<button type="button" data-aa-days="${v}" aria-pressed="${v===30}">${t}</button>`).join('')}</div><button type="button" class="aa-btn" data-aa-export disabled>일별 CSV 내보내기</button></div><p class="aa-status" role="status" aria-live="polite" id="aaStatus">관리자 인증 후 통계를 불러옵니다.</p><div id="aaReport"></div>`;
  function status(text){root.querySelector('#aaStatus').textContent=text;}
  function bars(rows){const max=Math.max(...rows.map(r=>r.value),1);return rows.map(r=>`<div class="aa-bar-row"><span>${esc(r.name)}</span><strong>${fmt(r.value)}</strong><div class="aa-track"><i style="width:${Math.min(100,r.value/max*100)}%"></i></div></div>`).join('');}
  function table(headers,rows,empty){return `<div class="aa-table-wrap"><table><thead><tr>${headers.map(t=>`<th scope="col">${esc(t)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map((x,i)=>i===0?`<th scope="row">${esc(x)}</th>`:`<td>${esc(x)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="aa-empty">${esc(empty)}</td></tr>`}</tbody></table></div>`;}
  function chart(series){
    const key=metric,max=Math.max(...series.map(r=>r[key]),1),w=880,h=170,p=14,step=(w-p*2)/Math.max(series.length-1,1);
    const points=series.map((r,i)=>[p+i*step,h-p-r[key]/max*(h-p*2)]);const line=points.map(x=>x.join(',')).join(' ');
    return `<div class="aa-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${metric==='visits'?'방문':'주문 저장 금액'} 일별 추이. 아래 표에서 정확한 값을 확인할 수 있습니다."><line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="#344139"/><polyline points="${line}" fill="none" stroke="#C6AA76" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${points.length===1?`<circle cx="${points[0][0]}" cy="${points[0][1]}" r="4" fill="#C6AA76"/>`:''}</svg><div class="aa-chart-axis"><span>${series[0].date}</span><span>최대 ${fmt(Math.max(...series.map(r=>r[key])))}${metric==='revenue'?'원':'회'}</span><span>${series.at(-1).date}</span></div></div>`;
  }
  function render(){
    if(!data||!allowed())return;
    const end=A.dateKey(Date.now()),range=A.keys(end,days),start=range[0],prior=A.keys(A.dateKey(Date.parse(start+'T00:00:00+09:00')-86400000),days),r=A.aggregate(data,start,end),p=A.aggregate(data,prior[0],prior.at(-1));
    const paidOK=data.ok.orders,visitsOK=data.ok.visits,funnelOK=data.ok.funnel;
    const partial=data.capped?' · 주문은 최근 1,000건 범위, 비교도 부분 집계':'';
    status(`${start} — ${end} · 한국시간(KST) · 조회 ${new Date(asOf).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul'})}${partial}${data.errors.length?' · 조회 실패: '+data.errors.join(', ')+' (새로고침으로 재시도)':''}`);
    const kpi=(label,value,note)=>`<article class="aa-kpi"><h3>${label}</h3><strong>${value}</strong><p>${esc(note)}</p></article>`;
    const b=data.ok.counters?A.baseline(data.counters):null;
    const correction=b?`초기 테스트 기준을 제외한 누적 참고값 <b>${fmt(b.revenue)}원 · ${fmt(b.count)}건</b>`:'누적 테스트 보정 참고값을 계산할 수 없습니다.';
    const storedTotal=data.orders.filter(o=>o.status==='paid').reduce((n,o)=>n+A.number(o.amount),0),counterTotal=A.number(data.counters.revenue);
    const reconciliation=paidOK&&data.ok.counters?`<p class="aa-reconcile">누적 기록 대조 · 조회된 완료 주문 저장 금액 ${fmt(storedTotal)}원 / 누적 결제 카운터 ${fmt(counterTotal)}원${storedTotal!==counterTotal?`<br><b>두 기록에 ${fmt(Math.abs(storedTotal-counterTotal))}원 차이가 있습니다.</b> 과거 주문의 요청 금액·누락·취소 이력을 페이앱 거래 내역과 대조해 주세요. 이 화면만으로 실제 매출을 확정하지 않습니다.`:' · 현재 조회 범위의 합계가 같습니다.'}${data.capped?' · 주문은 부분 조회 범위입니다.':''}</p>`:'';
    root.querySelector('#aaReport').innerHTML=`<div class="aa-kpis">${kpi('방문 기록',visitsOK?fmt(r.visits):'—',visitsOK?delta(r.visits,p.visits)+' · 방문 집계 기준':'방문 기록 조회 실패')}${kpi('신규 가입 이벤트',funnelOK?fmt(r.signups):'—',funnelOK?delta(r.signups,p.signups):'행동 기록 조회 실패')}${kpi('완료 주문 저장 금액',paidOK?fmt(r.revenue)+'원':'—',paidOK?'주문에 저장된 금액 · 테스트 포함 · 실제 매출 대조 필요'+(data.capped?' · 부분 집계':''):'주문 원장 조회 실패')}${kpi('완료 주문 / 평균 주문금액',paidOK?fmt(r.paid)+'건':'—',paidOK?'완료 주문당 '+(r.aov==null?'계산할 주문 없음':fmt(r.aov)+'원'):'주문 원장 조회 실패')}</div>
    <aside class="aa-baseline"><span class="aa-eyebrow">테스트 매출 구분</span><p>${correction}</p><small>운영자가 확인한 초기 테스트 13건·33,200원을 누적 결제 카운터에서 한 번 제외한 참고값입니다. 거래별 테스트 분류나 순매출이 아닙니다. 위 기간별 원장 수치와 아래 상품별 수치에는 이 일괄 보정을 적용하지 않습니다. 원본 통계·주문은 변경하지 않습니다.</small>${reconciliation}</aside>
    <section class="aa-panel"><div class="aa-panel-head"><div><h3>일별 흐름</h3><p>같은 축의 일별 기록으로 변화를 확인하세요.</p></div><div class="aa-period" role="group" aria-label="추이 지표"><button type="button" data-aa-metric="visits" aria-pressed="${metric==='visits'}">방문</button><button type="button" data-aa-metric="revenue" aria-pressed="${metric==='revenue'}">주문 저장 금액</button></div></div>${data.ok[metric==='visits'?'visits':'orders']?chart(r.series):'<p class="aa-empty">이 지표를 불러오지 못했습니다.</p>'}<details class="aa-daily"><summary>일별 수치 표 보기</summary>${table(['날짜','방문 기록','완료 주문','주문 저장 금액'],r.series.slice().reverse().map(x=>[x.date,visitsOK?fmt(x.visits):'—',paidOK?fmt(x.orders):'—',paidOK?fmt(x.revenue)+'원':'—']),'해당 기간 기록이 없습니다.')}</details></section>
    <div class="aa-two"><section class="aa-panel"><h3>상품별 결제</h3><p>결제 완료 주문 기준 · 테스트 포함</p>${paidOK?table(['상품','주문','금액'],r.products.map(x=>[x.name,fmt(x.count)+'건',fmt(x.revenue)+'원']),'완료된 주문이 없습니다.'):'<p class="aa-empty">주문 원장을 불러오지 못했습니다.</p>'}</section><section class="aa-panel"><h3>유입 경로</h3><p>검색·SNS·직접·기타 유입의 집계 기록</p>${data.ok.traffic?bars(r.traffic):'<p class="aa-empty">유입 기록을 불러오지 못했습니다.</p>'}</section></div>
    <section class="aa-panel"><h3>상담과 구매로 이어지는 주요 행동</h3><p>각 항목은 기간 내 독립적인 이벤트 건수입니다. 같은 이용자의 순서나 이동을 추적한 전환율이 아니며, 항목 간 차이를 이탈률로 해석하지 않습니다.</p>${funnelOK?bars(r.events):'<p class="aa-empty">행동 기록을 불러오지 못했습니다.</p>'}</section>
    <section class="aa-panel"><h3>검색 가이드 성과</h3><p>가이드에서 상담으로 이어진 기록 · 결제 이벤트, 주문 원장과 집계 기준이 다를 수 있습니다.</p>${data.ok.seo?table(['가이드','상담 유입','가입','첫 답변','결제 이벤트'],r.seo.slice(0,20).map(x=>['/'+x.name+'/',fmt(x.visits),fmt(x.signups),fmt(x.answers),fmt(x.purchases)]),'선택한 기간에 검색 가이드 유입 기록이 없습니다.'):'<p class="aa-empty">검색 가이드 기록을 불러오지 못했습니다.</p>'}${data.seoCapped?'<p>검색 가이드 기록은 최대 2,000개 문서 범위의 부분 집계입니다.</p>':''}</section>
    <details class="aa-definitions"><summary>집계 기준과 데이터 범위</summary><p>방문 기록은 dailyVisits, 행동은 dailyFunnel, 유입은 dailyTrafficSources, 가이드는 dailySeoLanding을 사용합니다. 일별 문서가 없는 날짜는 조회 성공 시 0으로 표시하며, 수집 시작 이전이나 미수집 구간을 구분할 수 없습니다. 비교는 직전 동일 일수 기준이며 오늘은 진행 중인 날짜입니다.</p><p>결제는 paymentOrders 중 status가 paid인 주문만 합산합니다. 페이앱 결제일이 있으면 한국시간으로 해석하고, 없으면 주문 생성일을 사용합니다. 생성일 필드가 없는 과거 주문은 기간별 조회에서 빠질 수 있습니다. 누적 요약은 stats/counters 기준이므로 원장 합계와 다를 수 있습니다. 대기 주문을 실패로 간주하지 않으며, 환불·취소·수수료가 완전히 대사된 순매출을 제공하지 않습니다.</p><p>기간별 집계는 최대 최근 1,000개 주문, 가이드 2,000개 문서를 읽습니다. 조회 실패는 0으로 대체하지 않습니다. CSV는 선택 기간의 집계값만 포함하며 회원 개인정보를 포함하지 않습니다.</p></details>`;
    root.querySelector('[data-aa-export]').disabled=!(visitsOK||paidOK);
  }
  async function load(){
    if(!allowed()||busy)return;busy=true;const token=++request;const button=root.querySelector('[data-aa-refresh]');button.disabled=true;status('기록을 불러오는 중입니다…');
    const first=A.keys(A.dateKey(Date.now()),180)[0],field=firebase.firestore.FieldPath.documentId();
    const daily=name=>db.collection(name).where(field,'>=',first).where(field,'<=',A.dateKey(Date.now())).get({source:'server'});
    const seoReport=async()=>{
      const token=await firebaseAuthUser.getIdToken();
      const response=await fetch('https://taekilso-backend-lemon.vercel.app/api/admin-report?start='+first+'&end='+A.dateKey(Date.now()),{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Object.assign(new Error('REPORT_UNAVAILABLE'),{code:response.status===401||response.status===403?'permission-denied':'unavailable'});
      const body=await response.json();if(!Array.isArray(body.rows)||body.rows.length>2000)throw new Error('INVALID_REPORT');
      return {docs:body.rows.map(row=>({id:row.date+'__'+row.slug,data:()=>row})),capped:!!body.capped};
    };
    const jobs=[['visits','방문',()=>daily('dailyVisits')],['funnel','행동',()=>daily('dailyFunnel')],['traffic','유입',()=>daily('dailyTrafficSources')],['seo','검색 가이드',seoReport],['orders','주문',()=>db.collection('paymentOrders').orderBy('createdAt','desc').limit(1001).get({source:'server'})],['counters','누적',()=>db.collection('stats').doc('counters').get({source:'server'})]];
    try{
      const results=await Promise.allSettled(jobs.map(([, ,run])=>Promise.resolve().then(run)));
      if(token!==request||!allowed())return;
      const next={ok:{},errors:[],orders:[],visits:[],funnel:[],traffic:[],seo:[],counters:{}};
      results.forEach((result,i)=>{const [key,label]=jobs[i];next.ok[key]=result.status==='fulfilled';if(result.status==='rejected'){const reason={'permission-denied':'조회 권한 확인 필요','failed-precondition':'조회 인덱스 확인 필요','unavailable':'연결 상태 확인 필요'}[result.reason?.code]||'조회 오류';next.errors.push(label+' · '+reason);return;}const snap=result.value;if(key==='counters')next.counters=snap.exists?snap.data():{};else next[key]=snap.docs.map(doc=>({...doc.data(),id:doc.id}));if(key==='seo')next.seoCapped=!!snap.capped;});
      next.capped=next.orders.length>1000;next.orders=next.orders.slice(0,1000);data=next;asOf=Date.now();render();
    }catch(e){if(allowed())status('통계를 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요.');}
    finally{busy=false;button.disabled=false;}
  }
  root.addEventListener('click',event=>{
    const btn=event.target.closest('button');if(!btn||!allowed())return;
    if(btn.hasAttribute('data-aa-refresh'))load();
    if(btn.dataset.aaDays){days=Number(btn.dataset.aaDays);root.querySelectorAll('[data-aa-days]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));render();}
    if(btn.dataset.aaMetric){metric=btn.dataset.aaMetric;render();}
    if(btn.hasAttribute('data-aa-export')&&data){
      const end=A.dateKey(Date.now()),r=A.aggregate(data,A.keys(end,days)[0],end),safe=v=>`"${String(v).replace(/"/g,'""')}"`;
      const csv='\uFEFF'+[['날짜(KST)','방문 기록','완료 주문(테스트 포함)','주문 저장 금액(실제 매출 대조 필요)'],...r.series.map(x=>[x.date,data.ok.visits?x.visits:'조회 실패',data.ok.orders?x.orders:'조회 실패',data.ok.orders?x.revenue:'조회 실패'])].map(row=>row.map(safe).join(',')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`taekilso-analytics-${end}-${days}days${data.capped?'-partial':''}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  });
  function sync(){
    if(typeof window.syncAdminExclusiveMode==='function')window.syncAdminExclusiveMode();
    const visible=!!allowed(),content=document.getElementById('adminContent');
    // A direct #admin load can finish routing before the saved login is restored.
    // Re-render the existing admin view after its navigation reflects the settled login.
    if(visible&&content.style.display==='none'&&typeof renderAdmin==='function')renderAdmin();
    if(!visible&&active&&document.getElementById('view-admin').classList.contains('visible')&&typeof renderAdmin==='function')renderAdmin();
    root.hidden=!visible;if(visible&&!active){active=true;load();}if(!visible&&active){active=false;++request;data=null;root.querySelector('#aaReport').replaceChildren();root.querySelector('[data-aa-export]').disabled=true;}
  }
  new MutationObserver(sync).observe(document.getElementById('view-admin'),{attributes:true,attributeFilter:['class','style']});
  new MutationObserver(sync).observe(document.getElementById('adminContent'),{attributes:true,attributeFilter:['style']});
  const nav=document.querySelector('.topbar');if(nav)new MutationObserver(sync).observe(nav,{childList:true,subtree:true});
  window.addEventListener('pageshow',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&allowed()&&Date.now()-asOf>300000)load();});sync();
})();
