const fs = require('node:fs');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');

module.exports = function normalizeAdminMembership(page) {
  const current = fs.readFileSync('src/home/administrator.js','utf8').replace(/\r\n/g,'\n').trimEnd();
  assert.equal(createHash('sha256').update(current).digest('hex'),
    'de60c7233b7ca9ce44530bd9864c0130422a7874febd7f917f777be36e7ad33c');
  assert.equal(page.split(current).length,2,'Mount the verified member management module exactly once');
  const previous = cp.execFileSync('git',['show','47c4e70b247f01a26bec48701091dbccd361c6a8:src/home/administrator.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n').trimEnd();
  return page.replace(current,()=>previous);
};
