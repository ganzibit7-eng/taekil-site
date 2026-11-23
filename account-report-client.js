(() => {
  'use strict';
  const checkout = window.TaekilCheckout;
  const retentionNotice = '결제 승인일부터 1년간 열람·보관';
  const expiryMessage = '리포트의 1년 보관 기간이 끝났어요.';
  const adminLabel = '관리자용 전체 리포트 열기';
  function canPreviewAsAdmin() {
    return typeof isAdmin==='function'&&isAdmin()&&firebaseAuthUser?.emailVerified===true&&
      firebaseAuthUser.providerData?.some(provider=>provider.providerId==='google.com')===true;
  }
  const koreaDateTime = new Intl.DateTimeFormat('ko-KR',{
    dateStyle:'long',timeStyle:'short',timeZone:'Asia/Seoul'
  });
  const koreaDate = new Intl.DateTimeFormat('ko-KR',{dateStyle:'long',timeZone:'Asia/Seoul'});
  function libraryExpiry(expiresAtMs) {
    if(!Number.isSafeInteger(expiresAtMs)||expiresAtMs<=0)return null;
    const note=document.createElement('span');
    note.className='history-report-expiry';
    const time=document.createElement('time');
    time.dateTime=new Date(expiresAtMs).toISOString();
    time.textContent=koreaDate.format(expiresAtMs);
    note.append('열람 기한 ',time);
    return note;
  }
  function expiryNote(expiresAtMs) {
    if(!Number.isSafeInteger(expiresAtMs)||expiresAtMs<=0)return null;
    const note=document.createElement('p');
    note.className='report-expiry-note';
    const time=document.createElement('time');
    time.dateTime=new Date(expiresAtMs).toISOString();
    time.textContent=koreaDateTime.format(expiresAtMs);
    note.append('열람 기한 ',time,' (한국시간)');
    return note;
  }

  async function request(endpoint, payload, token, timeout = 15000) {
    const headers = await getAiRequestHeaders();
    if (!accountStore.current(token) || !headers.Authorization) {
      throw new Error('로그인한 계정을 확인한 뒤 다시 시도해 주세요.');
    }
    const res = await fetch(endpoint,{
      method:'POST', headers, body:JSON.stringify(payload), signal:AbortSignal.timeout(timeout)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '리포트를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
    return data;
  }

  function pay(data, { price, name, payAppName = name, pendingKey, returnFlag, returnPath, memo, metricTopic }) {
    if (data.state !== 'checkout' || data.price !== price || data.name !== name ||
        !checkout.requireOpen() || !window.PayApp) return false;
    accountStore.setItem(pendingKey,data.id);
    window.PayApp.setParam({
      userid:PAYAPP_USERID,shopname:'택일소',goodname:payAppName,price:String(price),
      recvphone:'01000000000',smsuse:'n',checkretry:'y',redirectpay:'1',
      returnurl:location.origin+(returnPath || '/?'+returnFlag+'=1#history'),
      feedbackurl:PAYAPP_FEEDBACK_URL,var1:data.orderId,memo
    });
    window.PayApp.setTarget('_self');
    try {
      window.PayApp.payrequest();
    } catch (error) {
      if(metricTopic)window.TaekilCampaign?.activity('openError_'+metricTopic);
      throw error;
    }
    if(metricTopic)window.TaekilCampaign?.activity('checkout_'+metricTopic);
    return true;
  }

  function showResume(status,data,pendingKey){
    const url=new URL(data.resumeUrl);
    if(url.protocol!=='https:' || !['payapp.kr','www.payapp.kr','lite.payapp.kr'].includes(url.hostname) ||
        url.username || url.password || url.port) throw new Error('결제 주소를 확인하지 못했어요. 잠시 후 다시 확인해 주세요.');
    const owner=accountStore.snapshot();
    const link=document.createElement('a');
    link.href=url.href;
    link.className='btn';
    link.textContent=Number.isSafeInteger(data.price) && data.price > 0
      ? '기존 ' + data.price.toLocaleString('ko-KR') + '원 주문 이어하기'
      : '결제 이어하기';
    link.rel='noreferrer';
    link.addEventListener('click',event=>{
      if(!accountStore.current(owner) || !checkout.requireOpen()){event.preventDefault();return;}
      accountStore.setItem(pendingKey,data.id);
    });
    status.replaceChildren(document.createTextNode('기존 주문의 결제창을 다시 열 수 있어요. '),link);
  }
  function pendingMessage(data){
    if(data.waiting==='deposit') return '가상계좌 입금을 기다리고 있어요. 입금 후 내 기록을 다시 확인해 주세요.';
    return '기존 주문의 결제 상태를 확인 중이에요. 내 기록에서 잠시 후 다시 확인해 주세요.';
  }
  window.TaekilAccountReport = {request,pay,showResume,pendingMessage,retentionNotice,expiryMessage,expiryNote,libraryExpiry,adminLabel,canPreviewAsAdmin};
})();
