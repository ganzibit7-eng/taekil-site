const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('src/home/administrator.js','utf8');
const html = fs.readFileSync('src/home/account-and-tools.fragment','utf8');

function mount(context, names) {
  vm.createContext(context);
  for (const name of names) {
    const fn = code.match(new RegExp('^(?:async )?function ' + name + '\\([^]*?^}', 'm'));
    vm.runInContext(fn[0], context);
  }
  return context;
}

test('member filtering combines search with the selected activity and reports empty results', () => {
  const cards = [
    {dataset:{searchKey:'park',credits:'2',freeUsed:'1',lastSeenMs:String(Date.now())},style:{}},
    {dataset:{searchKey:'kim',credits:'0',freeUsed:'3',lastSeenMs:'0'},style:{}}
  ];
  const filter = {},result = {};
  const ctx = mount({document:{getElementById:id => id === 'adminMemberFilter' ? filter : result,querySelectorAll:() => cards}},['filterAdminUserList']);
  for (const [mode,query,wanted] of [['recent','','park'],['credits','Kim',''],['free_used','kIm','kim']]) {
    filter.value = mode; ctx.filterAdminUserList(query);
    assert.equal(cards.filter(card => !card.style.display).map(card => card.dataset.searchKey).join(''),wanted);
    assert.match(result.textContent,wanted ? /2명 중 1명/ : /없어요/);
  }
});

function fakeElement() {
  return {dataset:{},children:[],isConnected:true,setAttribute(){},replaceChildren(){this.children=[];},
    appendChild(node){this.children.push(node);},append(...nodes){this.children.push(...nodes);}};
}

test('only requested member orders load; repeated opens reuse a successful result and keep refunds distinct', async () => {
  const output = fakeElement();
  const details = Object.assign(fakeElement(),{dataset:{memberOrders:'uid-A'},querySelector:() => output});
  let calls = 0;
  const docs = ['paid','partially_refunded'].map((status,i) => ({id:'o' + i,data:() => ({uid:'uid-A',status,product:'report',amount:5900,ordered:i,entitlementReviewRequired:i > 0})}));
  const ctx = mount({document:{createElement:fakeElement},db:{collection(name){
    assert.equal(name,'paymentOrders');return {where(...args){
      assert.deepEqual(args,['uid','==','uid-A']);return {get:async ({source}) => {calls++;assert.equal(source,'server');return {docs};}};
    }};
  }},window:{TaekilAnalytics:{products:{report:'리포트'},orderTime:o => o.ordered}},adminFormatDateTime:String},['loadMemberOrderHistory']);
  await ctx.loadMemberOrderHistory(details,() => true);
  await ctx.loadMemberOrderHistory(details,() => true);
  assert.equal(calls,1);
  assert.match(output.children[0].children[0].textContent,/부분 환불/);
  assert.match(output.children[0].children[2],/이용권 반영 확인/);
  assert.match(output.children[1].children[0].textContent,/결제 승인/);
});

test('cooldown and permanent rows keep independent actions and pending deletion cannot be released', async () => {
  const wrap = fakeElement();
  const account = {active:true};
  const query = {value:'member@example.com'};
  const calls = [], actions = [];
  const rows = [
    {kind:'cooldown',uid:'a',banId:'r',bannedAtMs:1,rejoinAllowedAtMs:2},
    {kind:'permanent',uid:'b',banId:'b',deletionPending:true}
  ];
  const ctx = mount({
    accountStore:{snapshot:() => account,current:() => account.active},isAdmin:() => true,
    document:{getElementById:id => id === 'adminBanList' ? wrap : query,createElement:() => {
      const button = {};return {...fakeElement(),button,querySelector:() => button};
    }}, callAdminMemberSecurity:async (action,data) => {calls.push([action,data]);return {ok:true,bans:rows};},
    forceDeleteMember:(uid,label,ban) => actions.push('retry_'+ban.kind),
    unbanMember:ban => actions.push('release_'+ban.kind),
    adminFormatDateTime:String, escapeHtml:String
  },['loadAdminBanList']);
  await ctx.loadAdminBanList();
  assert.equal(calls[0][1].identityQuery,query.value);
  assert.match(wrap.children[0].innerHTML,/직접 탈퇴 · 30일/);
  assert.match(wrap.children[1].innerHTML,/탈퇴 처리 마치기/);
  wrap.children.forEach(row => row.button.onclick());
  account.active = false;wrap.children[0].button.onclick();
  assert.deepEqual(actions,['release_cooldown','retry_permanent']);
});

test('release confirms, uses the exact record kind and refreshes after acknowledgement', async () => {
  let allow = false;
  const calls = [];
  const button = {};
  const ctx = mount({confirm:() => allow,callAdminMemberSecurity:async (action,data) => {calls.push([action,data.kind,data.banId]);return {ok:true,unbanned:true};},
    loadAdminBanList:async () => calls.push('reload'),showToast(){}},['unbanMember']);
  const ban = {kind:'cooldown',banId:'r1'};
  await ctx.unbanMember(ban,'회원',button,() => true);assert.deepEqual(calls,[]);
  allow = true;await ctx.unbanMember(ban,'회원',button,() => true);
  assert.deepEqual(calls,[['unban_user','cooldown','r1'],'reload']);
});

test('destructive actions require explicit confirmation and fresh Google verification; premium grant is absent', () => {
  const fn = code.slice(code.indexOf('function forceDeleteMember('),code.indexOf('let adminPermState'));
  assert.match(fn,/uid === me.uid/);
  assert.match(fn,/field.value.trim\(\) !== '탈퇴'/);
  assert.ok(fn.indexOf('await me.reauthenticateWithPopup') < fn.indexOf("await callAdminMemberSecurity('force_delete'"));
  assert.match(fn,/force_delete', \{uid, confirmUid:uid\}/);
  assert.doesNotMatch(code,/grant_premium|askAdminDeletePassword/);
  assert.match(html,/hidden class="admin-perm-option" id="adminPermPremiumOption"/);
});
