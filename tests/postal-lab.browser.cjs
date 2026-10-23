const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try {
  const page=await browser.newPage();let calls=0;
  await page.addInitScript(()=>{
   window.chrome={storage:{local:{get:async()=>({routeSettings:{provider:'gemini',profiles:{groq:{apiKey:'fake-key'}}}}),set:()=>{throw Error('Test must never write settings');}}}};
  });
  await page.route('https://api.groq.com/**',async route=>{
   calls++;
   const sent=route.request().postDataJSON();
   assert.equal(route.request().headers().authorization,'Bearer fake-key');
   const cases=JSON.parse(sent.messages[1].content);
   const results=cases.map(c=>({id:c.id,status:'ambiguous',country:null,postcode:null,locality:null,reason:'Potrzebny dokładniejszy adres.',sources:[]}));
   if(calls===2)results[0].postcode='57072';
   await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify({results})}}]}});
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve(__dirname,'../postal-lab.html'));
  assert.equal(calls,0);
  await page.locator('#run-postal-test').click();
  await page.waitForFunction(()=>document.querySelector('#postal-test-status').textContent.includes('Zakończono'));
  assert.equal(await page.locator('#postal-test-results section').count(),4);
  await page.locator('#run-postal-test').click();
  await page.waitForFunction(()=>document.querySelector('#postal-test-status').textContent.includes('niejednoznacznego'));
  assert.equal(await page.locator('#postal-test-results section').count(),0);
  assert.ok(await page.locator('#run-postal-test').isEnabled());
  assert.deepEqual(errors,[]);
  console.log('PASS: no automatic request, saved Groq key only, no settings writes, renders results, rejects contradictory result and clears old proposals.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
