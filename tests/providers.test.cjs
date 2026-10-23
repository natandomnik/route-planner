const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function context(fetch) {
 const ctx = vm.createContext({fetch, setTimeout, clearTimeout});
 for (const file of ['src/core/providers.js','src/core/modules.js','src/core/settings.js','src/modules/ai-extraction/gemini.js','src/modules/ai-extraction/ai.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 return ctx;
}
const result = {points:['Warszawa','Berlin','Warszawa'],warnings:[]};
const chatResponse = () => ({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]})});
const configs = [
 ['openai','gpt-6-luna','https://api.openai.com/v1/chat/completions'],
 ['groq','openai/gpt-oss-20b','https://api.groq.com/openai/v1/chat/completions'],
 ['openrouter','openrouter/free','https://openrouter.ai/api/v1/chat/completions']
];
for (const [provider,model,endpoint] of configs) test(provider+' sends only its selected key to the fixed endpoint', async()=>{
 let calls=0;
 const ctx=context(async(url,options)=>{
  calls++;assert.equal(url,endpoint);assert.equal(options.headers.Authorization,'Bearer '+provider+'-key');assert.equal(options.redirect,'error');
  const body=JSON.parse(options.body);assert.equal(body.model,model);assert.equal(body.response_format.json_schema.strict,true);
  assert.ok(!options.body.includes('other-secret'));assert.ok(!url.includes('-key'));
  if(provider==='openai'){assert.equal(body.store,false);assert.equal(body.reasoning_effort,'none');}
  return chatResponse();
 });
 const parsed=await ctx.parseWithAI('text',{provider,model,apiKey:provider+'-key',profiles:{other:{apiKey:'other-secret'}}},new AbortController().signal);
 assert.equal(parsed.points.map(p=>p.query).join('|'),result.points.join('|'));assert.equal(calls,1);
});
test('migrates Gemini-only settings and keeps credentials isolated',()=>{
 const ctx=context();const migrated=ctx.normalizeRouteSettings({mode:'gemini',model:'gemini-custom',apiKey:'legacy-key'});
 assert.equal(migrated.mode,'ai');assert.equal(migrated.provider,'gemini');assert.equal(migrated.apiKey,'legacy-key');
 assert.equal(migrated.profiles.openai.apiKey,'');assert.equal(migrated.profiles.gemini.model,'gemini-custom');
 const selected=ctx.normalizeRouteSettings({...migrated,provider:'groq'});assert.equal(selected.apiKey,'');assert.equal(selected.model,'openai/gpt-oss-20b');
});
test('missing key or unknown provider causes no network request',async()=>{
 let calls=0;const ctx=context(async()=>{calls++;return chatResponse();});
 for(const settings of [{provider:'openai',model:'gpt-6-luna',apiKey:''},{provider:'https://other.example',model:'test',apiKey:'secret'}]) await assert.rejects(ctx.parseWithAI('text',settings,new AbortController().signal));
 assert.equal(calls,0);
});
test('does not use incomplete, refused or malformed model replies',async()=>{
 for(const choice of [{finish_reason:'length',message:{content:JSON.stringify(result)}},{finish_reason:'stop',message:{refusal:'no'}},{finish_reason:'stop',message:{content:'not JSON'}},{finish_reason:'stop',message:{content:'{"points":[42],"warnings":[]}'}}]){
  const ctx=context(async()=>({ok:true,json:async()=>({choices:[choice]})}));
  await assert.rejects(ctx.parseWithAI('text',{provider:'groq',model:'openai/gpt-oss-20b',apiKey:'fake'},new AbortController().signal));
 }
});
test('quota error never triggers another provider or exposes response text',async()=>{
 let calls=0;const ctx=context(async()=>{calls++;return {ok:false,status:429,json:async()=>({error:{message:'private information'}})};});
 await assert.rejects(ctx.parseWithAI('text',{provider:'openrouter',model:'openrouter/free',apiKey:'fake'},new AbortController().signal),/OpenRouter: Przekroczono limit/);
 assert.equal(calls,1);
});
test('AI request preserves informal source; diagnostic callback keeps empty model output',async()=>{
 const sourceText='de 02826 do pl 05 870';let diagnostic, sent;
 const ctx=context(async(url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"points":[],"warnings":["test"]}'}}]})};});
 const parsed=await ctx.parseWithAI(sourceText,{provider:'groq',model:'openai/gpt-oss-20b',apiKey:'fake'},new AbortController().signal,null,text=>diagnostic=text);
 assert.equal(sent.messages[1].content,sourceText);
 assert.equal(sent.messages[0].content,vm.runInContext('AI_ROUTE_PROMPT',ctx));
 assert.equal(JSON.parse(diagnostic).points.length,0);assert.equal(parsed.points.length,0);
});
test('invalid JSON remains visible in diagnostics but is not used as a route',async()=>{
 let diagnostic;
 const ctx=context(async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'bad json'}}]})}));
 await assert.rejects(ctx.parseWithAI('text',{provider:'groq',model:'openai/gpt-oss-20b',apiKey:'fake'},new AbortController().signal,null,text=>diagnostic=text),/JSON/);
 assert.equal(diagnostic,'bad json');
});
for (const provider of ['gemini','openai','groq','openrouter']) test(provider+' uses the saved custom prompt verbatim',async()=>{
 const customPrompt='Moja instrukcja.\nZachowaj przystanki i zwróć JSON.  ';
 let sent;
 const ctx=context(async(url,options)=>{
  sent=JSON.parse(options.body);
  return provider==='gemini'?{ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result)}]}}]})}:chatResponse();
 });
 const settings=ctx.normalizeRouteSettings({mode:'ai',provider,customPrompt,profiles:{[provider]:{apiKey:'fake'}}});
 await ctx.parseWithAI('trasa',settings,new AbortController().signal);
 assert.equal(provider==='gemini'?sent.systemInstruction.parts[0].text:sent.messages[0].content,customPrompt);
 assert.equal(ctx.normalizeRouteSettings({...settings,provider:'groq'}).customPrompt,customPrompt);
});
