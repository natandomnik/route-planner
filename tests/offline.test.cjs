const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {findRouteHubs} = require('../src/modules/hub-suggestions/hubs.js');
const {aiProvider, inferHubProvider} = require('../src/core/providers.js');

test('offline suggestions use strategy-specific fixtures without credentials or network', async () => {
  const original = global.fetch;
  global.fetch = () => {throw new Error('Network forbidden');};
  try {
    assert.equal(inferHubProvider('offline/demo'), 'offline');
    for (const strategy of ['radius', 'corridor']) {
      for (const role of ['A', 'B']) {
        for (const selection of [{provider:'offline',hubProvider:'gemini'}, {provider:'groq',hubProvider:'offline'}]) {
          const settings = {mode:'ai', ...selection, strategy};
          const rows = await findRouteHubs(['BE 4000 Liège', 'PL 55-095 Długołęka'], role, settings);
          assert.equal(rows.length, strategy === 'corridor' ? (role === 'A' ? 8 : 6) : 7);
          assert.equal(rows[0].label, strategy === 'corridor' ? (role === 'A' ? 'PODJAZD' : 'ZJAZD') : 'L');
          assert.ok(rows.every(row => row.demo && !row.sources.length));
          assert.equal(new Set(rows.map(row => row.city)).size, rows.length);
          const controller = new AbortController(); controller.abort();
          await assert.rejects(findRouteHubs(['A','B'], role, settings, controller.signal), {name:'AbortError'});
          await assert.rejects(findRouteHubs(['A','B'], role, {...settings,modules:{hubSuggestions:false}}));
        }
      }
    }
  } finally { global.fetch = original; }
});

test('offline extraction returns an explicitly marked demo without fetching', async () => {
  const context = vm.createContext({aiProvider, validateAiRoute: value => value, fetch: () => {throw new Error('Network forbidden');}});
  vm.runInContext(fs.readFileSync(require.resolve('../src/modules/ai-extraction/ai.js'), 'utf8'), context);
  const result = await context.parseWithAI('arbitrary input', {provider:'offline'});
  assert.equal(result.points.length, 2);
  assert.match(result.warnings[0], /testowe offline/);
});
