(() => {
  'use strict';
  const checkout = window.TaekilCheckout;

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

  function pay(data, { price, name, payAppName = name, pendingKey, returnFlag, returnPath, memo }) {
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
    window.PayApp.payrequest();
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
    link.textContent='결제 이어하기';
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
  window.TaekilAccountReport = {request,pay,showResume,pendingMessage};
})();
