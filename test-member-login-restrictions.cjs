const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const session = fs.readFileSync('src/home/member-session.js', 'utf8');
const check = session.slice(session.indexOf('async function checkAccountRestrictions('), session.indexOf('// 첫 로그인'));
function fixture() {
  const member = { uid: 'member-a', getIdToken: async () => 'test' };
  const auth = { currentUser: member, async signOut() { this.currentUser = null; } };
  const ctx = {
    memberAccessCache: new Map(), MEMBER_ACCESS_STATUS_URL: 'https://example.invalid/',
    firebase: { auth: () => auth }, firebaseAuthUser: member, clearLocalKakaoSessionForBan() {},
    window: { cleared: [], clearDeletedAccountCache(uid) { this.cleared.push(uid); } },
    showToast() {}, console: { warn() {} }
  };
  vm.runInNewContext(check, ctx);
  return { ctx, auth, member };
}
function response(status, data) {
  return { status, ok: status === 200, json: async () => data };
}
test('a member can retry immediately after an administrator lifts the restriction', async () => {
  const { ctx, auth, member } = fixture();
  for (const error of ['ACCOUNT_BANNED', 'ACCOUNT_REJOIN_COOLDOWN']) {
    auth.currentUser = member;
    ctx.fetch = async () => response(403, { error });
    assert.equal(await ctx.checkAccountRestrictions(member), false);
    assert.equal(auth.currentUser, null);
    assert.equal(ctx.memberAccessCache.size, 0);
  }
  auth.currentUser = member;
  ctx.fetch = async () => response(200, { allowed: true, uid: member.uid });
  assert.equal(await ctx.checkAccountRestrictions(member), true);
  assert.deepEqual(ctx.window.cleared, [member.uid, member.uid]);
});
test('a stale status response cannot sign out the next member', async () => {
  const { ctx, auth, member } = fixture();
  const next = { uid: 'member-b' };
  ctx.fetch = async () => {
    auth.currentUser = next;
    return response(403, { error: 'ACCOUNT_BANNED' });
  };
  assert.equal(await ctx.checkAccountRestrictions(member), false);
  assert.equal(auth.currentUser, next);
  assert.deepEqual(ctx.window.cleared, []);
});
test('an outage or an unrelated positive response never enables profile creation', async () => {
  const { ctx, member } = fixture();
  ctx.fetch = async () => { throw Error('offline'); };
  assert.equal(await ctx.checkAccountRestrictions(member), false);
  ctx.fetch = async () => response(200, { allowed: true, uid: 'member-b' });
  assert.equal(await ctx.checkAccountRestrictions(member), false);
  assert.equal(ctx.memberAccessCache.size, 0);
});
