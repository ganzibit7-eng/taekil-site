(() => {
  'use strict';
  const checkout = window.TaekilCheckout;

  async function request(endpoint, payload, token) {
    const headers = await getAiRequestHeaders();
    if (!accountStore.current(token) || !headers.Authorization) {
      throw new Error('로그인한 계정을 확인한 뒤 다시 시도해 주세요.');
    }
    const res = await fetch(endpoint,{
      method:'POST', headers, body:JSON.stringify(payload), signal:AbortSignal.timeout(15000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '리포트를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
    return data;
  }

  function pay(data, { price, name, pendingKey, returnFlag, memo }) {
    if (data.state !== 'checkout' || data.price !== price || data.name !== name ||
        !checkout.requireOpen() || !window.PayApp) return false;
    accountStore.setItem(pendingKey,data.id);
    window.PayApp.setParam({
      userid:PAYAPP_USERID,shopname:'택일소',goodname:name,price:String(price),
      recvphone:'01000000000',smsuse:'n',checkretry:'y',redirectpay:'1',
      returnurl:location.origin+'/?'+returnFlag+'=1#history',
      feedbackurl:PAYAPP_FEEDBACK_URL,var1:data.orderId,memo
    });
    window.PayApp.setTarget('_self');
    window.PayApp.payrequest();
    return true;
  }

  window.TaekilAccountReport = {request,pay};
})();
