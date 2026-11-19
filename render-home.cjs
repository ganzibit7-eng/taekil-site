const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'src', 'home');

const escapeText = text => String(text).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
})[char]);
const content = file => JSON.parse(fs.readFileSync(path.join(__dirname, 'content', file), 'utf8'));
const profile = '1990년 4월 2일 양력 · 출생시간·성별 미상';

function evidence(items) {
  return '<details class="public-reading-evidence"><summary>풀이에 사용한 계산 근거</summary><ul>' +
    items.map(item => '<li><strong>' + escapeText(item.label) + '</strong> · ' + escapeText(item.value) + '</li>').join('') +
    '</ul></details>';
}

function sampleFigure(sample) {
  return '<figure><figcaption>' + escapeText(sample.advisor) + '의 답변</figcaption><blockquote>' +
    sample.excerpt.map(paragraph => '<p>' + escapeText(paragraph) + '</p>').join('') +
    '</blockquote><small class="public-reading-source">가상 사주 · ' + profile + ' · 실제 답변 일부</small>' +
    evidence(sample.evidence) + '</figure>';
}

function fullSample(sample, open) {
  const body = sample.answer.split('\n\n').map(block => {
    const heading = block.match(/^\*\*(.+?)\*\*\n/);
    if (!heading) return '<p>' + escapeText(block).replaceAll('\n','<br>') + '</p>';
    return '<h3 class="ai-chat-heading">' + escapeText(heading[1]) + '</h3><p>' +
      escapeText(block.slice(heading[0].length)).replaceAll('\n','<br>') + '</p>';
  }).join('');
  return '<details class="ui-demo ui-real-demo"' + (open ? ' open' : '') + '><summary><span class="ui-real-topic">' +
    escapeText(sample.advisor) + ' 상담</span><span class="ui-real-title">' +
    escapeText(sample.question) + '</span></summary><div class="ui-real-respondent"><img src="' +
    escapeText(sample.portrait) + '" width="32" height="32" alt=""><b>' + escapeText(sample.advisor) +
    '</b><span>실제 택일소 답변</span></div><div class="ui-real-lead"><p>' +
    escapeText(sample.excerpt[0]) + '</p><small>답변 일부</small></div>' +
    '<details class="ui-real-full"><summary><span class="when-closed">전체 답변 읽기</span><span class="when-open">답변 접기</span></summary>' +
    '<div class="ui-real-answer">' + body + '</div></details>' + evidence(sample.evidence) + '</details>';
}

function renderHome() {
  const read = name => fs.readFileSync(path.join(source, name), 'utf8').replace(/\r\n/g, '\n');
  const samples = content('home-consultation-previews.json').examples;
  const featured = content('consultation-examples.json').examples;
  return read('page.template').replace(/^<!-- include ([\w.-]+) -->$/gm, (_, name) =>
    read(name).replace(/\n$/, ''))
    .replace(/<!-- reading-sample ([\w-]+) -->/g, (_, topic) =>
      sampleFigure(samples.find(sample => sample.topic === topic)))
    .replace('<!-- story-reading-templates -->', samples.filter(sample => !['career','reunion','saving'].includes(sample.topic))
      .map(sample => '<template id="story-reading-' + sample.topic + '" data-question="' + escapeText(sample.question) + '">' +
        sampleFigure(sample) + '</template>').join('\n'))
    .replace('<!-- full-reading-examples -->', featured.map((sample, index) => fullSample(sample, index === 0)).join('\n'));
}

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'index.html'), renderHome());
module.exports = renderHome;
