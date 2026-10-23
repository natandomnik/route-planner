const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/modules/ai-extraction/gemini.js'), 'utf8');
function parser(fetch) { const context = vm.createContext({fetch, setTimeout, clearTimeout}); vm.runInContext(source, context); return context.parseWithGemini; }
const settings = {model: 'gemini-3.1-flash-lite', apiKey: 'test-key'};
const signal = new AbortController().signal;
const response = result => ({ok: true, json: async () => ({candidates: [{finishReason: 'STOP', content: {parts: [{text: JSON.stringify(result)}]}}]})});
test('structured extraction preserves order and duplicates, sends key only in header', async () => {
 const parse = parser(async (url, options) => {
  assert.ok(!url.includes('test-key')); assert.equal(options.headers['x-goog-api-key'], 'test-key');
  const body = JSON.parse(options.body); assert.equal(body.contents[0].parts[0].text, 'zlecenie');
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  return response({points: ['Warszawa', 'Berlin', 'Warszawa'], warnings: []});
 });
 const result = await parse('zlecenie', settings, signal);
 assert.equal(result.points.map(p=>p.query).join('|'), 'Warszawa|Berlin|Warszawa');
});
test('missing key prevents network request', async () => {
 await assert.rejects(parser(()=>{throw Error('network called')})('text', {...settings,apiKey:''}, signal), /Dodaj klucz/);
});
test('rejects invalid output instead of silently dropping stops', async () => {
 for (const points of [[''], [42], ['x'.repeat(501)]]) await assert.rejects(parser(async()=>response({points,warnings:[]}))('text',settings,signal), /nieprawidłowe/);
});
test('quota error is actionable and does not expose raw API error', async () => {
 await assert.rejects(parser(async()=>({ok:false,status:429}))('text',settings,signal), /limit Gemini/);
});
test('truncated and blocked responses are not used', async () => {
 await assert.rejects(parser(async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS'}]})}))('text',settings,signal), /pełnego wyniku/);
});

test('503 is retried and a later success is returned', async () => {
 let calls = 0; const updates = [];
 const result = await parser(async () => ++calls === 1 ? {ok:false,status:503} : response({points:['Warszawa','Berlin'],warnings:[]}))('text',settings,signal, text=>updates.push(text));
 assert.equal(calls,2); assert.equal(result.points.length,2); assert.match(updates[0],/2\/3/);
});
test('persistent 503 stops after three attempts with an availability message', async () => {
 let calls = 0;
 await assert.rejects(parser(async()=>{calls++;return {ok:false,status:503};})('text',settings,signal), /niedostępna po 3 próbach/);
 assert.equal(calls,3);
});
test('changing input cancels pending retry without another request', async () => {
 let calls = 0; const controller = new AbortController();
 await assert.rejects(parser(async()=>{calls++;return {ok:false,status:503};})('text',settings,controller.signal,()=>controller.abort()), {name:'AbortError'});
 assert.equal(calls,1);
});
test('authentication errors are never retried', async () => {
 let calls = 0;
 await assert.rejects(parser(async()=>{calls++;return {ok:false,status:403};})('text',settings,signal), /Brak dostępu/);
 assert.equal(calls,1);
});

test('rejects bare DE/PL prefixes instead of replacing usable local points', async () => {
 for (const point of ['57, Germany', '39, Poland', 'DE 57', 'PL 39']) {
  await assert.rejects(parser(async()=>response({points:[point],warnings:[]}))('DE 57 Siegen ➞ PL 39 Ropczyce',settings,signal), /niepełny kod bez miejscowości/);
 }
});
test('accepts towns and full postal codes without losing intermediate stops', async () => {
 const points = ['Siegen, Germany', '02826, Germany', '39-100 Ropczyce, Poland'];
 const result = await parser(async()=>response({points,warnings:[]}))('route',settings,signal);
 assert.equal(result.points.map(p=>p.query).join('|'), points.join('|'));
});
