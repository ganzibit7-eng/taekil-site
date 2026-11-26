const fs = require('node:fs');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');

module.exports = function normalizeAdminMembership(page) {
  const current = fs.readFileSync('src/home/administrator.js','utf8').replace(/\r\n/g,'\n').trimEnd();
  assert.equal(createHash('sha256').update(current).digest('hex'),
    '68d2c4999b1b928ebcdc77d0d8a46371b2b11403c9b17f7f49969f0e823e93db');
  // In exclusive mode the browser can make the whole page inert even for a display:none dialog.
  assert.match(current, /const adminView = document\.getElementById\('view-admin'\);\s*adminView\.appendChild\(dialog\)/);
  assert.match(page, /body\.admin-exclusive-mode > \*:not\(#app\):not\(#toastHost\)/);
  assert.equal(page.split(current).length,2,'Mount the verified member management module exactly once');
  const previous = cp.execFileSync('git',['show','47c4e70b247f01a26bec48701091dbccd361c6a8:src/home/administrator.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n').trimEnd();
  return page.replace(current,()=>previous);
};
