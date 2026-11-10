(function(){
  'use strict';
  const store=window.accountStore;
  // Remove personal fields written by older analytics versions without touching conversations.
  try{const rows=JSON.parse(localStorage.getItem('taekilso_ai_funnel_v1')||'[]');if(Array.isArray(rows))localStorage.setItem('taekilso_ai_funnel_v1',JSON.stringify(rows.slice(-200).map(row=>({event:String(row?.event||'').slice(0,60),at:Number(row?.at||0)}))));}catch(_){}
  let owner=store.owner(), inquiryRequest=0;
  const clearIds=['aiChatWindow','aiChatStatus','aiConversationHistoryList','historyList','supportList','supportDetail','fortuneResult','sajuInsightResult','dateCards','bestResultHero','calendarWrap','dayDetail','resultsHeading','resultsSub','resultCount','profileName','profileMeta','profileUid','adminUserList','adminBanList','adminInquiryList'];
  function clearPrivateView(){
    store.invalidate();inquiryRequest++;
    window.__cleanupLegacyAdminViews?.();
    if(typeof adminPermState!=='undefined')adminPermState={uid:'',label:'',mode:'grant',type:'premium',count:1};
    if(typeof closeAdminPermissionModal==='function')closeAdminPermissionModal();
    store.clearGuest(['taekilso_locked_birth','taekilso_history','taekilso_my_inquiries','taekilso_ai_conversations_v1','taekilso_ai_active_session_v1','taekilso_saju_vault','taekilso_pending_paid_ai_question_v1','taekilso_pending_today_fortune_question_v1']);
    window.__aiConversationId=null;window.__aiChatHistory=[];window.__aiChatSubjects=[];window.__aiChatProfile=null;window.__aiChatSaju='';window.__freeReportSnapshot=null;window.__newyearChatContext=false;window.__pendingCategoryQuestion=null;window.__pendingPaidAiQuestion='';
    window.__chronological=null;window.__ctx=null;window.__visibleResultCandidates=[];window.__resultCompareSelections=new Set();window.__dayDetailResult=null;
    for(const key of Object.keys(window))if(/^__result_\d+$/.test(key))window[key]=null;
    if(typeof aiShareCurrentText!=='undefined')aiShareCurrentText='';
    document.getElementById('aiShareAnswer')?.replaceChildren();
    document.getElementById('aiShareModal')?.classList.remove('show');
    for(const id of ['results','supportStatus']){const el=document.getElementById(id);if(el)el.style.display='none';}
    for(const id of clearIds){const el=document.getElementById(id);if(el)el.replaceChildren();}
    for(const id of ['aiChatInput','supportTitle','supportMessage']){const el=document.getElementById(id);if(el)el.value='';}
    for(const id of ['aiChatPanel','aiChatSetup','supportDetail']){const el=document.getElementById(id);if(el)el.style.display='none';}
    const intro=document.getElementById('homeIntroOverlay');if(intro)intro.style.display='';
    document.getElementById('aiChatSendBtn')?.removeAttribute('disabled');
    document.querySelector('.ai-chat-stage')?.classList.remove('ai-chat-thinking');
    for(const id of ['birthYear','birthMonth','birthDay','birthDate','birthTime','partnerYear','partnerMonth','partnerDay','partnerBirthDate','partnerBirthTime','fortuneYear','fortuneMonth','fortuneDay','insightYear','insightMonth','insightDay','aiChatSavedProfile','aiChatYear','aiChatMonth','aiChatDay','aiChatCompareProfile','aiChatCompareProfile2']){const el=document.getElementById(id);if(el){el.value='';el.disabled=false;}}
    const profileName=document.getElementById('aiChatProfileName');if(profileName)profileName.value='나';
    for(const id of ['aiChatHour','aiChatGender']){const el=document.getElementById(id);if(el)el.value='unknown';}
    document.querySelectorAll('input[type="checkbox"][id*="Lock"]').forEach(el=>el.checked=false);
    for(const prefix of ['birth','fortune','insight'])if(typeof setInputsDisabled==='function')setInputsDisabled(prefix,false);
    if(typeof clearAiFollowupSuggestions==='function')clearAiFollowupSuggestions();
    if(typeof refreshAiProfileSelectors==='function')refreshAiProfileSelectors();
    if(typeof renderSajuVault==='function')renderSajuVault();
    if(typeof updateHistoryCounts==='function')updateHistoryCounts();
  }
  const originalAuthNav=window.updateAuthNav;
  window.updateAuthNav=function(){
    const next=store.owner(),changed=next!==owner;if(changed){owner=next;clearPrivateView();}
    const result=originalAuthNav.apply(this,arguments);
    if(changed&&document.getElementById('view-profile')?.classList.contains('visible')&&typeof renderProfile==='function')renderProfile();
    window.dispatchEvent(new CustomEvent('taekilso:authChanged',{detail:{owner}}));
    if(changed&&next){
      if(typeof syncSajuVaultFromCloud==='function')syncSajuVaultFromCloud(next);
      if(document.getElementById('view-history')?.classList.contains('visible'))syncAiConversationHistoryFromCloud();
      if(document.getElementById('view-support')?.classList.contains('visible'))renderSupportList();
    }
    return result;
  };
  const originalLogout=window.logout;
  window.logout=function(){store.beginSignOut();clearPrivateView();return originalLogout.apply(this,arguments);};
  window.clearDeletedAccountCache=function(uid){
    if(!uid)return;
    store.removeOwner(['taekilso_locked_birth','taekilso_history','taekilso_my_inquiries','taekilso_ai_conversations_v1','taekilso_ai_active_session_v1','taekilso_pending_paid_ai_question_v1','taekilso_pending_today_fortune_question_v1','taekilso_last_order_id','taekilso_last_purchase_at'],uid);
    try{localStorage.removeItem('taekilso_saju_vault_'+uid);}catch(_){}
    if(uid===store.owner())clearPrivateView();
  };
  // An ownerless legacy draft must never be silently uploaded as a new account's inquiry.
  window.flushLocalOnlyInquiries=async function(){};
  const renderLocal=window.renderSupportList;
  window.renderSupportList=function(){
    renderLocal();const token=store.snapshot(),request=++inquiryRequest;
    if(!token.owner||!db)return;
    db.collection('inquiries').where('ownerUid','==',token.owner).limit(100).get().then(snap=>{
      if(!store.current(token)||request!==inquiryRequest)return;
      const list=snap.docs.map(doc=>({...doc.data(),id:doc.id})).filter(q=>q.ownerUid===token.owner)
        .sort((a,b)=>Number(b.createdAtMs||0)-Number(a.createdAtMs||0))
        .map(q=>({id:q.id,title:q.title,ownerUid:token.owner,createdAt:Number(q.createdAtMs||0)}));
      store.setItem('taekilso_my_inquiries',JSON.stringify(list));renderLocal();
      if(snap.size===100)showSupportStatus('문의는 최대 100건까지 표시돼요. 이전 문의는 이메일로 확인해 주세요.','info');
    }).catch(()=>{if(store.current(token)&&request===inquiryRequest)showSupportStatus('문의 내역을 불러오지 못했어요. 잠시 후 다시 열어 주세요.','error');});
  };
  const overlay=document.getElementById('authOverlay');
  if(overlay){
    let previous=null;
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','택일소 로그인');overlay.tabIndex=-1;
    const close=overlay.querySelector('.auth-close');if(close){close.setAttribute('role','button');close.setAttribute('aria-label','로그인 닫기');close.tabIndex=0;close.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();close.click();}});}
    const originalOpen=window.openAuthModal,originalClose=window.closeAuthModal;
    window.openAuthModal=function(){previous=document.activeElement;const result=originalOpen.apply(this,arguments);requestAnimationFrame(()=>{if(overlay.style.display!=='none')(overlay.querySelector('button,input,[tabindex="0"]')||overlay).focus({preventScroll:true});});return result;};
    window.closeAuthModal=function(){const result=originalClose.apply(this,arguments);if(previous?.isConnected)previous.focus({preventScroll:true});return result;};
    document.addEventListener('keydown',e=>{
      if(e.defaultPrevented||overlay.style.display==='none'||!overlay.getClientRects().length||document.body.classList.contains('report-auth-open'))return;
      if(e.key==='Escape'){e.preventDefault();closeAuthModal();return;}
      if(e.key!=='Tab')return;
      const items=[...overlay.querySelectorAll('button,input,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=items[0]||overlay,last=items[items.length-1]||overlay;
      if(e.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){e.preventDefault();first.focus();}
    });
  }
})();
