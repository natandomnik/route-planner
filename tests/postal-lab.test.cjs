const {test} = require('node:test');
const assert = require('node:assert/strict');
const {runPostalTest, validatePostalTest, POSTAL_TEST_CASES} = require('../postal-lab.js');
const rows = () => POSTAL_TEST_CASES.map(c => ({id:c.id,status:'ambiguous',country:null,postcode:null,locality:null,reason:'Brak jednoznacznych danych.',sources:[]}));
test('does not treat an uncertain code as a usable proposal',()=>{
 const results=rows();results[0].postcode='57072';
 assert.throws(()=>validatePostalTest({results}),/niejednoznacznego/);
});
test('requires sources and all address fields for candidates',()=>{
 const results=rows(); Object.assign(results[0],{status:'candidate',country:'DE',postcode:'57072',locality:'Siegen'});
 assert.throws(()=>validatePostalTest({results}),/źródła/);
 results[0].sources=[{url:'https://www.siegen.de/',evidence:'Adres urzędu.'}];
 assert.equal(validatePostalTest({results})[0].postcode,'57072');
 results[0].sources[0].url='javascript:alert(1)';assert.throws(()=>validatePostalTest({results}),/źródło/);
});
test('rejects missing and duplicate cases',()=>{
 assert.throws(()=>validatePostalTest({results:rows().slice(1)}),/Niepełny/);
 const results=rows();results[1].id=results[0].id;assert.throws(()=>validatePostalTest({results}),/identyfikatory/);
});
test('uses only Groq, forces search, and omits incompatible structured outputs', async()=>{
 const original=global.fetch;
 try {
  global.fetch=async(url,options)=>{
   assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');
   assert.equal(options.headers.Authorization,'Bearer fake-key');
   const body=JSON.parse(options.body);
   assert.equal(body.model,'openai/gpt-oss-20b');assert.equal(body.tool_choice,'required');
   assert.deepEqual(body.tools,[{type:'browser_search'}]);assert.equal(body.response_format,undefined);
   assert.ok(!options.body.includes('fake-key'));assert.ok(!options.body.includes('expectation'));
   return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({results:rows()})}}]})};
  };
  assert.equal((await runPostalTest('fake-key',new AbortController().signal)).length,4);
 } finally {global.fetch=original;}
});
test('missing key does not send request',async()=>{
 await assert.rejects(runPostalTest('',new AbortController().signal),/Zapisz klucz/);
});
