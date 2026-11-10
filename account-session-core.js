(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaekilAccountCore=api;})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  function key(base,owner){return base+'__owner_v2__'+encodeURIComponent(owner||'guest');}
  function createStore(local,session,getOwner){
    let generation=0,blockedOwner=null;
    const owner=()=>{const uid=getOwner()||null;if(blockedOwner&&uid!==blockedOwner)blockedOwner=null;return uid===blockedOwner?null:uid;};
    return {
      owner,key:base=>key(base,owner()),
      getItem(base){try{return (owner()?local:session).getItem(key(base,owner()));}catch(_){return null;}},
      setItem(base,value){try{(owner()?local:session).setItem(key(base,owner()),value);}catch(_){}},
      removeItem(base){try{(owner()?local:session).removeItem(key(base,owner()));}catch(_){}},
      snapshot(){return {owner:owner(),generation};},
      current(token){return !!token&&token.owner===owner()&&token.generation===generation;},
      invalidate(){generation++;},
      beginSignOut(){blockedOwner=getOwner()||null;generation++;},
      removeOwner(bases,uid){if(!uid)return;for(const base of bases)try{local.removeItem(key(base,uid));}catch(_){}},
      clearGuest(bases){for(const base of bases)try{session.removeItem(key(base,null));}catch(_){} }
    };
  }
  return {key,createStore};
});
if(typeof window!=='undefined')window.accountStore=window.TaekilAccountCore.createStore(window.localStorage,window.sessionStorage,()=>{
  try{const user=window.firebase?.auth?.().currentUser;return user&&!user.isAnonymous?user.uid:null;}catch(_){return null;}
});
