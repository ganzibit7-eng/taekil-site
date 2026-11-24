const {execFileSync} = require('node:child_process');
const ref = '5847e6715951216e8b9496728852ed28e950c652';
const previous = file => execFileSync('git',['show',ref + ':src/home/' + file],{encoding:'utf8'}).replace(/\r\n/g,'\n');
const member = previous('member-support.js');
const admin = previous('administrator.js');
const beforeProductInquiries = execFileSync('git',['show','2f2166144867651da632d4335e0d46143ae66864:src/home/member-support.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');

module.exports = function normalizeInquiryChanges(source) {
  for (const [snapshot, name] of [[admin,'renderAdminInquiries'],[member,'submitInquiry'],[member,'renderSupportList'],[member,'showInquiryDetail'],[beforeProductInquiries,'fillCommonInquiry'],[beforeProductInquiries,'requestRefund']]) {
    const pattern = new RegExp('^(?:async )?function ' + name + '\\([^]*?^}', 'm');
    const original = snapshot.match(pattern)[0];
    source = source.replace(pattern, () => original);
  }
  return source.replace(/\nasync function registerSupportInquiry\([^]*?^}\n/m, '');
};
