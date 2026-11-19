const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'src', 'home');

function renderHome() {
  const read = name => fs.readFileSync(path.join(source, name), 'utf8').replace(/\r\n/g, '\n');
  return read('page.template').replace(/^<!-- include ([\w.-]+) -->$/gm, (_, name) =>
    read(name).replace(/\n$/, ''));
}

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'index.html'), renderHome());
module.exports = renderHome;
