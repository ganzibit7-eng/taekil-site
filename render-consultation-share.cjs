const pages = require('./content/consultation-share-pages.json');
const samples = require('./content/home-consultation-previews.json').examples;

const origin = 'https://taekilso.com';
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[char]);
const expected = [...samples.map(sample => sample.topic), 'yeonwoo', 'newyear'];
if (Object.keys(pages).length !== expected.length || !expected.every(topic => Object.hasOwn(pages, topic))) {
  throw new Error('Share pages must cover the public consultation stories');
}

function renderSharePage(home, topic) {
  if (!Object.hasOwn(pages, topic)) throw new Error('Unknown public consultation: ' + topic);
  const page = pages[topic];
  const urlPath = '/consultation/' + topic + '/';
  const url = origin + urlPath;
  const image = origin + '/' + page.image;
  const route = topic === 'yeonwoo' ? 'home' : ['newyear', 'wedding'].includes(topic) ? topic : 'topic-' + topic;
  let html = home
    .replace('<html lang="ko" data-home-layout="directory">', '<html lang="ko" data-home-layout="directory" data-share-path="' + urlPath + '" data-share-route="' + route + '">')
    .replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<base href="/">')
    .replace(/<title>[^<]*<\/title>/, () => '<title>' + escapeHtml(page.title) + '</title>')
    .replace('<link rel="canonical" href="' + origin + '/">', '<link rel="canonical" href="' + url + '">');
  const metadata = [
    ['name', 'description', page.description],
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
    ['property', 'og:image:width', page.width],
    ['property', 'og:image:height', page.height],
    ['property', 'og:image:alt', page.title],
    ['name', 'twitter:title', page.title],
    ['name', 'twitter:description', page.description],
    ['name', 'twitter:image', image]
  ];
  for (const [attribute, key, value] of metadata) {
    const prefix = '<meta ' + attribute + '="' + key + '" content="';
    html = html.replace(new RegExp(prefix + '[^"]*">'), () => prefix + escapeHtml(value) + '">');
  }
  return html;
}

module.exports = {pages, renderSharePage};
