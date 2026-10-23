const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const file of fs.readdirSync(path.join(root, 'tests')).filter(file => file.endsWith('.browser.cjs')).sort()) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests', file)], {cwd: root, stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}
