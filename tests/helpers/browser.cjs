const fs = require('node:fs');
const path = require('node:path');
function launchOptions() {
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.CHROME_PATH || (process.platform === 'darwin' && fs.existsSync(localChrome) ? localChrome : undefined);
  return {headless: true, ...(executablePath ? {executablePath} : {})};
}
function artifactPath(name) {
  const dir = path.resolve(__dirname, '../../test-results');
  fs.mkdirSync(dir, {recursive: true});
  return path.join(dir, name);
}
module.exports = {launchOptions, artifactPath};
