const {test} = require('node:test');
const assert = require('node:assert/strict');
const {normalizeRouteModules} = require('../src/core/modules.js');
const {findRouteHubs} = require('../src/modules/hub-suggestions/hubs.js');
const vm = require('node:vm');const fs = require('node:fs');const path = require('node:path');
test('legacy installs retain enabled features and only explicit booleans override defaults', () => {
 assert.deepEqual(normalizeRouteModules(), {timocom:true,suggestionMap:true,recognitionHistory:true,aiExtraction:true,postalLookup:true,hubSuggestions:true,postalLab:true});
 assert.equal(normalizeRouteModules({postalLookup:false}).postalLookup,false);
 assert.equal(normalizeRouteModules({postalLookup:'false'}).postalLookup,true);
 assert.equal(normalizeRouteModules(null).hubSuggestions,true);
 assert.equal(normalizeRouteModules({unknown:true}).unknown,undefined);
});
test('disabled AI and hub services reject before network access', async () => {
 const context=vm.createContext({fetch:()=>{throw Error('Network called');}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/modules/ai-extraction/ai.js'),'utf8'),context);
 await assert.rejects(context.parseWithAI('route',{modules:{aiExtraction:false}},new AbortController().signal),/wyłączony/);
 await assert.rejects(findRouteHubs(['A','B'],'A',{modules:{hubSuggestions:false}},new AbortController().signal),/wyłączony/);
});
