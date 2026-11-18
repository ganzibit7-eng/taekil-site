// Keep the existing vault paths; wait for cloud deletion before removing local data.
(() => {
  const store=window.accountStore,queues=new Map(),deletions=new Map();
  if(store){
    function enqueue(token,task){
      const key=token.owner||'',previous=queues.get(key)||Promise.resolve();
      const next=previous.catch(()=>{}).then(()=>store.current(token)?task():false);
      queues.set(key,next);
      const clear=()=>{if(queues.get(key)===next)queues.delete(key);};next.then(clear,clear);
      return next;
    }
    // A late vault refresh must finish before a delete, so it cannot upload the
    // just-deleted profile again. Queue saves through the same per-account path.
    for(const name of ['syncSajuVaultFromCloud','saveSajuProfileToCloud']){
      const original=window[name];if(typeof original!=='function')continue;
      window[name]=function(...args){const token=store.snapshot();return enqueue(token,()=>original.apply(this,args));};
    }
    window.deleteSajuProfile=function(id){
      const token=store.snapshot(),key=JSON.stringify([token.owner,id]);
      if(deletions.has(key))return deletions.get(key);
      if(!getSajuVault().some(p=>p.id===id)||!confirm('이 사주를 보관함에서 삭제할까요?'))return Promise.resolve(false);
      const operation=enqueue(token,async()=>{
        if(token.owner){
          const user=typeof firebaseReady!=='undefined'&&firebaseReady&&firebase.auth?firebase.auth().currentUser:null;
          if(!db||!user||user.isAnonymous||user.uid!==token.owner)throw new Error('VAULT_AUTH_NOT_READY');
          await getSajuVaultCloudRef(user.uid).doc(id).delete();
        }
        if(!store.current(token))return false;
        setSajuVault(getSajuVault().filter(p=>p.id!==id));
        return true;
      }).catch(()=>{
        if(store.current(token)&&typeof showToast==='function')showToast('사주를 삭제하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.');
        return false;
      });
      deletions.set(key,operation);operation.then(()=>deletions.delete(key));return operation;
    };
  }
  const select=document.getElementById('aiChatSavedProfile'),button=document.getElementById('aiChatDeleteProfile'),meta=document.getElementById('aiChatSelectedProfileMeta');
  if(!select||!button)return;
  let busy=false;
  function selected(){return typeof getSajuVault==='function'?getSajuVault().find(p=>p.id===select.value):null;}
  function sync(){
    const p=selected();button.hidden=!p;button.disabled=busy;
    const date=p?`${p.y}.${String(p.m).padStart(2,'0')}.${String(p.d).padStart(2,'0')}`:'';
    const label=p?`${p.name||'선택한 사주'} (${date}) 삭제`:'선택한 사주 삭제';
    button.setAttribute('aria-label',label);button.title=label;
    if(meta){meta.hidden=!p;meta.textContent=p?`${date} · ${p.calType==='lunar'?'음력':'양력'}${p.isLeap?' · 윤달':''}`:'';}
  }
  button.addEventListener('click',async()=>{
    const p=selected();if(!p||busy||typeof deleteSajuProfile!=='function')return;
    busy=true;sync();
    try{
      await deleteSajuProfile(p.id);
      if(!getSajuVault().some(row=>row.id===p.id)&&select.value===p.id)select.value='';
    }catch(_){if(typeof showToast==='function')showToast('사주를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');}
    finally{busy=false;sync();}
  });
  select.addEventListener('change',sync);
  const observer=new MutationObserver(sync);observer.observe(select,{childList:true,subtree:true});
  const setup=document.getElementById('aiChatSetup');if(setup)observer.observe(setup,{attributes:true,attributeFilter:['style','class']});
  sync();
})();
