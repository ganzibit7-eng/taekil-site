'use strict';

// Fixtures for Firebase Rules projects.test. No requests touch a member document.
const {createHash} = require('node:crypto');
const digest = text => createHash('sha256').update(text).digest('hex');
const base = '/databases/(default)/documents/';
const instant = '2026-11-26T04:00:00.000Z';
const now = Date.parse(instant);
const uid = 'example-member';
const email = 'sample@example.invalid';
const google = 'test-google-account';
const member = {uid, token:{email, email_verified:true, auth_time:now / 1000 - 3,
  firebase:{sign_in_provider:'google.com', identities:{'google.com':[google]}}}};
const kakao = {uid:'kakao_12345', token:{auth_time:now / 1000, firebase:{sign_in_provider:'custom'}}};
const accountPath = 'users/' + uid + '/sajuProfiles/example';
const googleKey = digest('provider:google.com:' + google);
const uidKey = digest('uid:' + uid);
const session = 'rejoinBlockKeys/SESSION-' + uidKey;
const tests = [];

function check(name, expectation, options = {}) {
  const {auth = member, path = accountPath, method = 'get', existing, payload, docs = {}} = options;
  const req = {method, path:base + path, time:instant};
  if (auth) req.auth = auth;
  if (payload) req.resource = {data:payload};
  const identities = [uidKey, googleKey, digest('uid:' + kakao.uid), digest('email:' + email)];
  const all = new Set([session, 'rejoinBlockKeys/SESSION-' + digest('uid:' + kakao.uid), ...Object.keys(docs)]);
  for (const key of identities) {
    for (const collection of ['memberBanKeys','memberRejoinKeys','rejoinBlockKeys']) all.add(collection + '/' + key);
  }
  const mocks = [];
  for (const doc of all) {
    const args = [{exactValue:base + doc}];
    mocks.push({function:'exists', args, result:{value:Object.hasOwn(docs, doc)}});
    mocks.push({function:'get', args, result:{value:docs[doc] ? {data:docs[doc]} : null}});
  }
  tests.push({name, test:{expectation, request:req, functionMocks:mocks,
    ...(existing ? {resource:{data:existing}} : {})}});
}

check('active Google member opens own vault', 'ALLOW');
check('foreign vault stays private', 'DENY', {path:'users/another/sajuProfiles/example'});
check('anonymous visitor cannot read a member', 'DENY', {auth:null});
check('active Kakao member uses own vault', 'ALLOW', {auth:kakao,path:'users/' + kakao.uid + '/aiConversations/example'});
check('original session cannot rewrite a deleted profile', 'DENY', {method:'create',path:'users/' + uid,
  payload:{premium:false},docs:{['memberBanKeys/' + uidKey]:{banId:'example-ban'}}});
check('same Google identity with a new UID cannot register during cooldown', 'DENY', {
  method:'create', path:'users/' + uid, payload:{premium:false},
  docs:{['rejoinBlockKeys/' + googleKey]:{rejoinAllowedAtMs:now + 10000}}});
check('legacy cooldown mirror is respected', 'DENY', {docs:{['memberRejoinKeys/' + uidKey]:{untilMs:now + 1}}});
check('automatic expiry permits access at the boundary', 'ALLOW', {docs:{['rejoinBlockKeys/' + uidKey]:{rejoinAllowedAtMs:now}}});
check('released identity rejects token authenticated before deletion', 'DENY', {docs:{[session]:{revokedAuthTimeThrough:now / 1000 - 2}}});
check('same UID may rejoin after a fresh sign-in', 'ALLOW', {auth:{...member,token:{...member.token,auth_time:now / 1000}},
  docs:{[session]:{revokedAuthTimeThrough:now / 1000 - 2}}});
check('Kakao fixed UID cannot read a retained dispute during restriction', 'DENY', {auth:kakao,path:'inquiries/example',
  existing:{ownerUid:kakao.uid},docs:{['memberBanKeys/' + digest('uid:' + kakao.uid)]:{banId:'example-ban'}}});
check('provider-less legacy token recognizes verified identity', 'DENY', {
  auth:{uid,token:{email,email_verified:true}}, docs:{['memberBanKeys/' + digest('email:' + email)]:{banId:'example-ban'}}});
check('unverified email cannot inherit another member restriction', 'ALLOW', {
  auth:{uid,token:{email,email_verified:false}}, docs:{['memberBanKeys/' + digest('email:' + email)]:{banId:'example-ban'}}});
check('owner may read a retained order', 'ALLOW', {path:'paymentOrders/example',existing:{uid}});
check('disabled membership cannot read retained orders', 'DENY', {path:'paymentOrders/example',existing:{uid},
  docs:{['memberBanKeys/' + uidKey]:{banId:'example-ban'}}});
const order = {uid,amount:1900,product:'ai_question_pack_5',status:'pending',createdAt:instant};
check('valid enabled checkout continues to accept the existing product', 'ALLOW', {method:'create',path:'paymentOrders/example',
  payload:order,docs:{'siteSettings/checkout':{enabled:true}}});
check('a restriction also protects direct checkout', 'DENY', {method:'create',path:'paymentOrders/example',
  payload:order,docs:{'siteSettings/checkout':{enabled:true},['memberBanKeys/' + googleKey]:{banId:'example-ban'}}});
check('client cannot enumerate private restriction markers', 'DENY', {path:'rejoinBlockKeys/anything'});
const admin = {...member, token:{...member.token, email:'green092432@gmail.com'}};
check('verified site administrator may list another member', 'ALLOW', {method:'list',path:'users/other-member',auth:admin});
check('ordinary member cannot list another member', 'DENY', {method:'list',path:'users/other-member'});
check('unverified administrator address cannot list another member', 'DENY', {method:'list',path:'users/other-member',
  auth:{...admin,token:{...admin.token,email_verified:false}}});
check('stale administrator token after own withdrawal is denied', 'DENY', {method:'list',path:'users/other-member',auth:admin,
  docs:{[session]:{revokedAuthTimeThrough:now/1000 - 2}}});
module.exports = tests;
