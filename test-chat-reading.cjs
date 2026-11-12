const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const source=html.slice(html.indexOf('function formatAiReply(text){'),html.indexOf('/* 메시지가 추가된 직후',html.indexOf('function formatAiReply(text){')));
const ctx={escapeAiHtml:s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};
vm.createContext(ctx);vm.runInContext(source,ctx);
test('standalone markdown separators render as rules without accumulating blank lines',()=>{
  assert.equal(ctx.formatAiReply('앞 문단\n\n---\n\n뒷 문단'),'앞 문단<hr class="ai-chat-divider">뒷 문단');
  assert.equal(ctx.formatAiReply('A---B'),'A---B');
});
test('reply formatting still escapes HTML and preserves heading, emphasis and bullets',()=>{
  const result=ctx.formatAiReply('## 제목\n**중요**\n- 기준\n<script>alert(1)</script>');
  assert.match(result,/ai-chat-heading/);assert.match(result,/ai-chat-strong/);assert.match(result,/ai-chat-bullet/);
  assert.ok(!result.includes('<script>'));assert.ok(result.includes('&lt;script&gt;'));
});
test('Korean composition Enter is held while ordinary Enter and Shift+Enter keep existing handling',()=>{
  const js=fs.readFileSync(__dirname+'/consultation-stage.js','utf8');
  const body=js.match(/input\?\.addEventListener\('keydown', event => \{([\s\S]*?)\n  \}, true\);/)[1];
  const handler=new Function('event',body);
  for(const [isComposing,keyCode,expected] of [[true,13,true],[false,229,true],[false,13,false]]){
    let stopped=false;handler({key:'Enter',isComposing,keyCode,stopImmediatePropagation(){stopped=true;}});assert.equal(stopped,expected);
  }
});
