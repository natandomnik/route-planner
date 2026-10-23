const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
assert.equal(manifest.version, pkg.version, 'Manifest and package versions must agree');
assert.equal(manifest.manifest_version, 3);
for (const name of [manifest.background.service_worker, manifest.action.default_popup, manifest.options_ui.page]) assert.ok(fs.existsSync(path.join(root, name)), name);
for (const name of ['popup.html', 'options.html', 'postal-lab.html']) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
    if (/^https?:/.test(match[1])) continue;
    assert.ok(fs.existsSync(path.join(root, match[1])), `${name}: missing ${match[1]}`);
  }
  assert.ok(html.indexOf('src/core/modules.js') < html.indexOf('src/core/settings.js'), 'Module registry must load before settings');
}
function check(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (/\.c?js$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', file], {stdio: 'inherit'});
      if (result.status !== 0) process.exit(result.status || 1);
    }
  }
}
for (const dir of ['src', 'scripts', 'tests']) check(path.join(root, dir));
console.log('PASS: manifest paths, HTML assets, load order, versions and JavaScript syntax.');
