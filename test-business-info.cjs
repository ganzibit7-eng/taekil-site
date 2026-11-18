const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
test('every public page displays the registered operator and usable contacts without publishing the certificate or birth date',()=>{
 const pages=cp.execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n');let count=0;
 for(const file of pages){
  const html=fs.readFileSync(file,'utf8');if(!html.includes('</body>'))continue;
  const block=html.match(/<!-- BUSINESS_INFO_START -->\s*([\s\S]*?)\s*<!-- BUSINESS_INFO_END -->/)?.[1];assert.ok(block,file);
  for(const value of ['테일모라','김도윤','804-03-03583','첨단연신로 216, 109동 1501호','신고 면제 · 간이과세자','tel:01021305797','mailto:contact@taekilso.com'])assert.ok(block.includes(value),file+': '+value);
  assert.ok(!/2004|생년월일|<img/.test(block),file+': unrelated certificate data');
  assert.equal((html.match(/href="\/business-info.css\?v=20261118"/g)||[]).length,1,file);
  assert.ok(html.indexOf(block)<html.lastIndexOf('© 2026 택일소. All rights reserved.'),file+': business details before copyright');count++;
 }
 assert.ok(count>=70);
});
