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
  assert.deepEqual(JSON.parse(body.messages[1].content),{anchor:'Ropczyce, Poland',role:'B',route:['Warburg, Germany','Berlin, Germany','Ropczyce, Poland'],strategy:'radius'});
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
 await assert.rejects(findRouteHubs(['a','b'],'A',{mode:'ai',hubModel:'gpt-6-luna',profiles:{}},new AbortController().signal),/klucz OpenAI/);
 await assert.rejects(findRouteHubs(['a','b'],'A',{mode:'ai',hubModel:'gemini-3.1-flash-lite',profiles:{}},new AbortController().signal),/klucz Google Gemini/);
 }finally{global.fetch=original;}
});
test('uses OpenAI model with Bearer key when selected for hubs', async () => {
  const original = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer openai-key');
      const body = JSON.parse(options.body);
      assert.equal(body.model, 'gpt-6-luna');
      assert.equal(body.response_format.type, 'json_object');
      assert.ok(!options.body.includes('groq-key'));
      return {ok: true, json: async () => ({choices: [{finish_reason: 'stop', message: {content: '{"suggestions":[]}'}}]})};
    };
    assert.deepEqual(await findRouteHubs(['Warszawa, Poland', 'Berlin, Germany'], 'A', {mode: 'ai', hubModel: 'gpt-6-luna', profiles: {openai: {apiKey: 'openai-key'}, groq: {apiKey: 'groq-key'}}}, new AbortController().signal), []);
  } finally { global.fetch = original; }
});
test('uses Gemini model with x-goog-api-key when selected for hubs', async () => {
  const original = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.ok(url.startsWith('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite'));
      assert.equal(options.headers['x-goog-api-key'], 'gemini-key');
      const body = JSON.parse(options.body);
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      return {ok: true, json: async () => ({candidates: [{finishReason: 'STOP', content: {parts: [{text: '{"suggestions":[]}'}]}}]})};
    };
    assert.deepEqual(await findRouteHubs(['Warszawa, Poland', 'Berlin, Germany'], 'B', {mode: 'ai', hubModel: 'gemini-3.1-flash-lite', profiles: {gemini: {apiKey: 'gemini-key'}, groq: {apiKey: 'groq-key'}}}, new AbortController().signal), []);
  } finally { global.fetch = original; }
});

test('corridor validates category ranges, retains moderately extended hubs, excludes anchor and origin',()=>{
 const options={strategy:'corridor',anchor:'PL 55-095 Długołęka',origin:'BE 4000 Liège'};
 const rows=[{...item('PODJAZD','Nearby',25)},item('TRASA 1','Early',40),item('TRASA 2','Middle',55),item('HUB 1','Far',120),{...item('HUB 2','Liege',50),country:'BE',postcode:'4020'}, {...item('ZJAZD','Dlugoleka',900),country:'PL',postcode:'55-095'}];
 assert.deepEqual(validateHubSuggestions({suggestions:rows},options).map(x=>x.label),['PODJAZD','TRASA 1','TRASA 2','HUB 1']);
 assert.deepEqual(validateHubSuggestions({suggestions:[item('PODJAZD','Too far',51),item('TRASA 2','Too far',71)]},options),[]);
 assert.throws(()=>validateHubSuggestions({suggestions:[item('N')]},options));
 assert.deepEqual(validateHubSuggestions({suggestions:[item('HUB 1','Far',120)]}),[]);
});
test('radius excludes normalized anchor locality even with another postcode',()=>{
 assert.deepEqual(validateHubSuggestions({suggestions:[{...item('N','Liege'),country:'BE',postcode:'4020'}]}, {anchor:'BE 4000 Liège'}),[]);
});
test('every provider sends corridor prompt and complete ordered route for B',async()=>{
 const original=global.fetch;
 try {
 for(const [provider,model] of [['groq','openai/gpt-oss-120b'],['gemini','gemini-test'],['openai','gpt-6-luna'],['openrouter','openrouter/free']]) {
  global.fetch=async(url,options)=>{
   const body=JSON.parse(options.body);
   const prompt=provider==='gemini'?body.systemInstruction.parts[0].text:body.messages[0].content;
   const input=JSON.parse(provider==='gemini'?body.contents[0].parts[0].text:body.messages[1].content);
   assert.match(prompt,/across a border/);
   assert.deepEqual(input,{anchor:'PL 55-095 Długołęka',role:'B',route:['BE 4000 Liège','DE Berlin','PL 55-095 Długołęka'],strategy:'corridor'});
   const content=JSON.stringify({suggestions:[item('REGION','Kassel',120)]});
   return {ok:true,json:async()=>provider==='gemini'?{candidates:[{finishReason:'STOP',content:{parts:[{text:content}]}}]}:{choices:[{finish_reason:'stop',message:{content}}]}};
  };
  const result=await findRouteHubs(['BE 4000 Liège','DE Berlin','PL 55-095 Długołęka'],'B',{mode:'ai',strategy:'corridor',hubProvider:provider,hubModel:model,profiles:{[provider]:{apiKey:'fake'}}},new AbortController().signal);
  assert.equal(result[0].roadKm,120);
 }
 }finally{global.fetch=original;}
});

test('corridor splits endpoint categories and rejects the actual destination', () => {
 const suggestions=[item('PODJAZD','Local',15),item('HUB 1','Hub',120),item('ZJAZD','Exit',20),item('POWRÓT','Return',30),item('REGION','Region',45)];
 assert.deepEqual(validateHubSuggestions({suggestions},{strategy:'corridor',role:'A'}).map(x=>x.label), ['PODJAZD','HUB 1']);
 assert.deepEqual(validateHubSuggestions({suggestions},{strategy:'corridor',role:'B',destination:'DE 34123 Region'}).map(x=>x.label), ['ZJAZD','POWRÓT']);
});

test('expanded corridor keeps distinct towns with repeated categories but limits category and endpoint counts',()=>{
 const rows=['PODJAZD','PODJAZD','PODJAZD','TRASA 1','TRASA 1','TRASA 2','TRASA 2','HUB 1','HUB 2'].map((label,i)=>item(label,'Town '+i,25));
 const accepted=validateHubSuggestions({suggestions:rows},{strategy:'corridor',role:'A'});
 assert.equal(accepted.length,8);
 assert.equal(accepted.filter(x=>x.label==='PODJAZD').length,2);
 const b=['ZJAZD','ZJAZD','POWRÓT','POWRÓT','REGION','REGION'].map((label,i)=>item(label,'Town '+i,25));
 assert.equal(validateHubSuggestions({suggestions:b},{strategy:'corridor',role:'B'}).length,6);
});
