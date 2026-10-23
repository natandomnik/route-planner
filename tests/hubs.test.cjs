const {test}=require('node:test');const assert=require('node:assert/strict');
const {validateHubSuggestions,findRouteHubs}=require('../src/modules/hub-suggestions/hubs.js');
const item=(label,city='Kassel',roadKm=45)=>({label,city,country:'DE',postcode:'34123',roadKm,reason:'Strefa logistyczna',sources:['https://www.kassel.de/']});
test('filters duplicates, unconfirmed codes and points outside distance limits',()=>{
 const suggestions=[item('N'),item('HUB 1'),item('S','Other',116),{...item('W','Other'),postcode:'34'}, {...item('E','Other'),sources:[]},item('L','Neighbour',9),item('HUB 2','Second hub',80)];
 assert.deepEqual(validateHubSuggestions({suggestions}).map(i=>i.label),['N','HUB 2']);
});
test('rejects malformed data and unsafe source URLs',()=>{
 assert.throws(()=>validateHubSuggestions({suggestions:[null]}));
 assert.deepEqual(validateHubSuggestions({suggestions:[{...item('L'),sources:['javascript:alert(1)']}]}),[]);
 assert.throws(()=>validateHubSuggestions({suggestions:Array(8).fill(item('L'))}));
});
test('uses independent selected Groq model and B anchor with full ordered route',async()=>{
 const original=global.fetch;try {
 global.fetch=async(url,options)=>{
  assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer groq-key');
  const body=JSON.parse(options.body);assert.equal(body.model,'openai/gpt-oss-120b');assert.equal(body.tool_choice,'required');assert.equal(body.response_format,undefined);
  assert.deepEqual(JSON.parse(body.messages[1].content),{anchor:'Ropczyce, Poland',role:'B',route:['Warburg, Germany','Berlin, Germany','Ropczyce, Poland']});
  assert.ok(!options.body.includes('other-key'));
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"suggestions":[]}'}}]})};
 };
 assert.deepEqual(await findRouteHubs(['Warburg, Germany','Berlin, Germany','Ropczyce, Poland'],'B',{mode:'ai',hubModel:'openai/gpt-oss-120b',profiles:{groq:{apiKey:'groq-key'},openai:{apiKey:'other-key'}}},new AbortController().signal),[]);
 }finally{global.fetch=original;}
});
test('local mode and absent keys never send requests',async()=>{
 const original=global.fetch;global.fetch=()=>{throw Error('Network must not be used');};try {
 await assert.rejects(findRouteHubs(['a','b'],'A',{mode:'local'},new AbortController().signal),/Włącz/);
 await assert.rejects(findRouteHubs(['a','b'],'A',{mode:'ai'},new AbortController().signal),/klucz Groq/);
 }finally{global.fetch=original;}
});
