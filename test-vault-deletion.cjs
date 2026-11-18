const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('./account-session-core');
const source=fs.readFileSync('profile-picker-controls.js','utf8');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function fixture(){
 let uid='A',rows=[{id:'one'},{id:'two'}],deletes=0,confirmations=0;const notices=[],storage={getItem:()=>null,setItem(){},removeItem(){}},store=C.createStore(storage,storage,()=>uid),pending=deferred();
 const context={Promise,Map,JSON,document:{getElementById:()=>null},accountStore:store,firebaseReady:true,firebase:{auth:()=>({currentUser:uid?{uid}:null})},db:{},getSajuVault:()=>rows,setSajuVault:value=>{rows=value;},getSajuVaultCloudRef:()=>({doc:()=>({delete:()=>{deletes++;return pending.promise;}})}),confirm:()=>{confirmations++;return true;},showToast:text=>notices.push(text)};
 context.window=context;
 return {context,pending,notices,rows:()=>rows,deletes:()=>deletes,confirmations:()=>confirmations,as:next=>{uid=next;},start:()=>vm.runInNewContext(source,context)};
}
test('cloud failure retains the saved profile and reports failure instead of pretending to delete',async()=>{
 const f=fixture();f.start();const work=f.context.deleteSajuProfile('one');await Promise.resolve();assert.equal(f.rows().length,2);f.pending.reject(Error('offline'));assert.equal(await work,false);assert.equal(f.rows().length,2);assert.equal(f.notices.length,1);
});
test('confirmed deletion waits for the server, deduplicates repeated clicks, and preserves other profiles',async()=>{
 const f=fixture();f.start();const a=f.context.deleteSajuProfile('one'),b=f.context.deleteSajuProfile('one');assert.equal(a,b);await Promise.resolve();assert.equal(f.rows().length,2);f.pending.resolve();assert.equal(await a,true);assert.deepEqual(f.rows(),[{id:'two'}]);assert.equal(f.deletes(),1);assert.equal(f.confirmations(),1);
});
test('a deletion completion for account A cannot remove a same-ID profile after switching to B',async()=>{
 const f=fixture();f.start();const work=f.context.deleteSajuProfile('one');await Promise.resolve();await Promise.resolve();f.as('B');f.pending.resolve();assert.equal(await work,false);assert.equal(f.rows().length,2);assert.equal(f.notices.length,0);
});
test('queued vault refresh completes before deletion so it cannot recreate a deleted cloud profile',async()=>{
 const f=fixture(),refresh=deferred(),steps=[];f.context.syncSajuVaultFromCloud=async()=>{steps.push('refresh');await refresh.promise;steps.push('uploaded');};f.start();
 const sync=f.context.syncSajuVaultFromCloud('A'),remove=f.context.deleteSajuProfile('one');await Promise.resolve();assert.equal(f.deletes(),0);refresh.resolve();await sync;await Promise.resolve();assert.equal(f.deletes(),1);f.pending.resolve();assert.equal(await remove,true);assert.deepEqual(steps,['refresh','uploaded']);
});
test('guest-only profiles are removed locally without a cloud request',async()=>{
 const f=fixture();f.as(null);f.start();assert.equal(await f.context.deleteSajuProfile('one'),true);assert.deepEqual(f.rows(),[{id:'two'}]);assert.equal(f.deletes(),0);
});
test('a mismatched Firebase session preserves the profile and never deletes another owner document',async()=>{
 const f=fixture();f.context.firebase.auth=()=>({currentUser:{uid:'B'}});f.start();assert.equal(await f.context.deleteSajuProfile('one'),false);assert.equal(f.deletes(),0);assert.equal(f.rows().length,2);assert.equal(f.notices.length,1);
});
test('cancelling confirmation leaves both cloud and local vault unchanged',async()=>{
 const f=fixture();f.context.confirm=()=>false;f.start();assert.equal(await f.context.deleteSajuProfile('one'),false);assert.equal(f.deletes(),0);assert.equal(f.rows().length,2);
});
