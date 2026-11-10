// Reuse the vault's existing deletion/confirmation; do not create another data path.
(() => {
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
