const {launchOptions, artifactPath}=require('./helpers/browser.cjs');
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch(launchOptions());
 try {
 const page=await browser.newPage();let release,calls=0,hold=false,fail=false;
 await page.addInitScript(()=>{
  const saved={routeSettings:{mode:'ai',provider:'groq',profiles:{groq:{apiKey:'fake-key'}}}};
  const area={get:async k=>({[k]:saved[k]}),set:async obj=>Object.assign(saved,obj),remove:async k=>delete saved[k]};
  window.chrome={storage:{local:area,session:area,onChanged:{addListener:()=>{}}}};
  window.copies=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>window.copies.push(t)}});
 });
 await page.route('https://api.groq.com/**',async route=>{
  calls++;const body=route.request().postDataJSON();assert.equal(body.tool_choice,'required');
  assert.equal(route.request().headers().authorization,'Bearer fake-key');
  if(hold)await new Promise(r=>release=r);
  const cases=JSON.parse(body.messages[1].content);
  const results=cases.map(c=>({id:c.id,status:c.input.includes('Siegen')?'ambiguous':'candidate',country:c.input.includes('Siegen')?'DE':'PL',postcode:c.input.includes('Siegen')?null:'39-100',locality:c.input.includes('Siegen')?'Siegen':'Ropczyce',reason:'test',sources:[{url:'https://ropczyce.eu/kontakt/',evidence:'test'}]}));
  await route.fulfill({status:fail?429:200,json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify({results})}}]}}).catch(()=>{});
 });
 await page.goto('file://'+path.resolve(__dirname,'../popup.html'));
 await page.locator('#source').fill('DE Siegen -> PL Ropczyce');
 await page.waitForFunction(()=>!document.querySelector('#copy-points').disabled);
 assert.equal(calls,0);
 await page.locator('#copy-points').click();
 await page.waitForFunction(()=>copies.length===1);
 assert.equal(await page.evaluate(()=>copies[0]),'DE Siegen\nPL 39-100 Ropczyce');
 assert.equal(await page.locator('#point-1').inputValue(),'Ropczyce, Poland');
 fail=true;await page.locator('#copy-points').click();await page.waitForFunction(()=>copies.length===2);
 assert.equal(await page.evaluate(()=>copies[1]),'DE Siegen\nPL Ropczyce');
 fail=false;hold=true;await page.locator('#copy-points').click();
 await page.waitForTimeout(100);assert.ok(await page.locator('#copy-points').isDisabled());
 assert.equal(await page.locator('#copy-points').getAttribute('aria-busy'),'true');
 assert.equal(await page.locator('#copy-points').evaluate(el=>getComputedStyle(el,'::after').animationName),'copy-spin');
 assert.equal(await page.locator('#copy-points svg').evaluate(el=>getComputedStyle(el).visibility),'hidden');
 await page.locator('#point-1').fill('Błonie, Poland');release();
 await page.waitForFunction(()=>!document.querySelector('#copy-points').disabled);
 assert.equal(await page.evaluate(()=>copies.length),2);
 assert.equal(await page.locator('#copy-points').getAttribute('aria-busy'),'false');
 assert.equal(await page.locator('#copy-points svg').evaluate(el=>getComputedStyle(el).visibility),'visible');
 assert.match(await page.locator('#status').textContent(),/Trasa się zmieniła/);
 const beforeLocal=calls;
 await page.evaluate(async()=>{const saved=await chrome.storage.local.get('routeSettings');saved.routeSettings.mode='local';});
 await page.locator('#copy-points').click();await page.waitForFunction(()=>copies.length===3);
 assert.equal(calls,beforeLocal);
 assert.equal(await page.evaluate(()=>copies[2]),'DE Siegen\nPL Błonie');
 await page.evaluate(async()=>{const saved=await chrome.storage.local.get('routeSettings');saved.routeSettings.mode='ai';saved.routeSettings.profiles.groq.apiKey='';});
 await page.locator('#copy-points').click();await page.waitForFunction(()=>copies.length===4);
 assert.equal(calls,beforeLocal);assert.match(await page.locator('#status').textContent(),/brak zapisanego klucza/);
 console.log('PASS: explicit lookup, only Groq key, plain enriched clipboard, original fields retained, API fallback, no duplicate requests, stale edits never copied.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
