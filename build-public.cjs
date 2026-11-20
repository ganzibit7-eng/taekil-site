// Publish only tracked browser assets. Repository metadata, rules and checks stay private to the build.
const fs = require('node:fs');
const path = require('node:path');
const {pages, renderSharePage} = require('./render-consultation-share.cjs');
const cp = require('node:child_process');
const root = __dirname;
const destination = path.join(root, 'dist');
const files = cp.execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean);
const publicFile = file => {
  if (file.startsWith('.') || file.startsWith('src/') || file.startsWith('docs/') || file.startsWith('firebase/')) return false;
  if (file.startsWith('assets/')) return /\.(?:png|jpe?g|webp|svg|ico|mp4|woff2?)$/i.test(file);
  if (file.startsWith('content/')) return file.endsWith('.json');
  if (file.includes('/')) return file.endsWith('.html');
  return /\.(?:html|js|css|png|jpe?g|webp|svg|ico|mp4|xml|txt)$/i.test(file) || ['manifest.json','_routes.json'].includes(file);
};
fs.mkdirSync(destination, {recursive: true});
// Refuse a stale output directory instead of publishing files from an earlier build.
if (fs.readdirSync(destination).length) throw new Error('dist must be empty before building');
const homepage = require('./render-home.cjs')();
fs.writeFileSync(path.join(destination, 'index.html'), homepage);
let bytes = Buffer.byteLength(homepage);
for (const [topic, page] of Object.entries(pages)) {
  if (!files.includes(page.image)) throw new Error('Untracked share image for ' + topic);
  const output = path.join(destination, 'consultation', topic, 'index.html');
  const html = renderSharePage(homepage, topic);
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, html);
  bytes += Buffer.byteLength(html);
}
const published = files.filter(publicFile);
for (const file of published) {
  const source = path.join(root, file);
  const size = fs.statSync(source).size;
  if (size > 25 * 1024 * 1024) throw new Error('Cloudflare Pages file limit: ' + file);
  const target = path.join(destination, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(source, target);
  bytes += size;
}
// Do not index the alternate Pages hostname; the existing public domain remains canonical.
const sitemapPath=path.join(destination,'sitemap.xml');
const sitemap=fs.readFileSync(sitemapPath,'utf8');
const consultationEntries=Object.keys(pages).map(topic=>'  <url><loc>https://taekilso.com/consultation/'+topic+'/</loc></url>');
fs.writeFileSync(sitemapPath,sitemap.replace('</urlset>',consultationEntries.join('\n')+'\n</urlset>'));
fs.writeFileSync(path.join(destination, '_headers'), 'https://:project.pages.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:hash.:project.pages.dev/*\n  X-Robots-Tag: noindex\n');
console.log(JSON.stringify({files: published.length + Object.keys(pages).length + 2, bytes, output: destination}));
