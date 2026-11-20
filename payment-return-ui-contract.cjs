'use strict';
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

// Normalize only the purchase confirmation sections updated in this release.
const previousCheckout = execFileSync('git',['show','0ef4a449af13471a06e165247e02a36749785411:src/home/checkout.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
module.exports = function normalizePaymentReturn(source) {
  source = source.replace('<b>상담을 이어가세요.</b>', '<b>방금 하던 상담을 그대로 이어가세요.</b>')
    .replace('결제가 확인되면 방금 선택한 질문을 이어가요.', '결제가 확인되면 방금 선택한 질문부터 자동으로 이어집니다.')
    .replace('이어서 질문할 이용권을 골라 주세요.', '필요한 만큼 질문권을 추가하거나 프리미엄으로 넉넉하게 이용할 수 있어요.')
    .replace("  /* CHECKOUT_END */\n}\nwindow.addEventListener('taekilso:questionPackPurchased'", "  /* CHECKOUT_END */\n  scrollAiChatToBottom(win);\n}\nwindow.addEventListener('taekilso:questionPackPurchased'")
    .replace('  if (typeof appendAiChatUpsell === \'function\') appendAiChatUpsell(question);\n}', '  if (typeof appendAiChatUpsell === \'function\') appendAiChatUpsell(question);\n  scrollAiChatToBottom(document.getElementById(\'aiChatWindow\'));\n}');
  if (!source.includes('async function confirmReturnedPayment()')) return source;
  function restore(start,end,oldStart=start) {
    const from=source.indexOf(start),to=source.indexOf(end,from);
    const oldFrom=previousCheckout.indexOf(oldStart),oldTo=previousCheckout.indexOf(end,oldFrom);
    assert(from>=0&&to>=from&&oldFrom>=0&&oldTo>oldFrom,'Missing payment return contract boundary');
    source=source.slice(0,from)+previousCheckout.slice(oldFrom,oldTo)+source.slice(to);
  }
  const orderDeclaration="  const orderId = 'TAK-'";
  restore(orderDeclaration,orderDeclaration,'  let creditsBeforePurchase = null;');
  restore('async function getQuestionCreditsFromServer','async function getQuestionCreditsFromServer','/* 질문권처럼 소모성이라');
  restore('async function refreshQuestionCreditUI','async function payPremium()','async function waitForVerifiedQuestionPack');
  restore('function readPendingPayment()','async function checkPremiumOnServer','(async function checkPremiumReturn()');
  return source.replace('      paymentUid: paymentUser.uid,\n      activeConversationId:', '      creditsBeforePurchase,\n      paymentUid: paymentUser.uid,\n      activeConversationId:')
    .replace('      amount: PREMIUM_PRICE,\n      paymentUid: uidForOrder,','      amount: PREMIUM_PRICE,')
    .replace('    if (verifiedPremium && !readPendingPayment()?.product) {','    if (verifiedPremium) {');
};
