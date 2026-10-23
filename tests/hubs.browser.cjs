const {launchOptions, artifactPath}=require('./helpers/browser.cjs');
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch(launchOptions());
 try {
 const page=await browser.newPage({viewport:{width:550,height:950}});let calls=0,hold=false,release,sent;
 const data={"routeSettings":{"mode":"ai","provider":"groq","customPrompt":"Custom prompt","profiles":{"groq":{"apiKey":"fake-key"}}}};
 await page.exposeBinding('testStorageGet',(_source,k)=>({[k]:data[k]}));
 await page.exposeBinding('testStorageSet',(_source,v)=>{Object.assign(data,v);});
 await page.exposeBinding('testStorageRemove',(_source,k)=>{delete data[k];});
 await page.addInitScript(()=>{
  const area={get:k=>window.testStorageGet(k),set:async obj=>{await window.testStorageSet(obj);},remove:k=>window.testStorageRemove(k)};
  window.chrome={storage:{local:area,session:area,onChanged:{addListener:()=>{}}}};
 });
 await page.route('https://api.groq.com/**',async route=>{
  calls++;sent=route.request().postDataJSON();if(hold)await new Promise(r=>release=r);
  const item=(label,city,postcode)=>({label,city,postcode,country:'DE',roadKm:45,reason:'Strefa logistyczna',sources:['https://www.kassel.de/']});
  await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:JSON.stringify({suggestions:[item('N','Paderborn','33098'),item('HUB 1','Kassel','34123')]})}}]}}).catch(()=>{});
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root='file://'+path.resolve(__dirname,'..')+'/';await page.goto(root+'popup.html');
 await page.locator('#source').fill('DE 34414 Warburg -> DE 10115 Berlin -> PL 39-100 Ropczyce');
 await page.waitForFunction(()=>document.querySelectorAll('.point').length===3);
 assert.equal(calls,0);assert.equal(await page.locator('.hub-toggle').count(),2);
 await page.locator('.hub-toggle[data-role="A"]').click();await page.locator('#hub-panel-A .hub-chip').first().waitFor();
 assert.equal(sent.model,'openai/gpt-oss-120b');assert.equal(JSON.parse(sent.messages[1].content).anchor,'34414 Warburg, Germany');
 assert.equal(await page.locator('#hub-panel-A').evaluate(el=>getComputedStyle(el).display),'flex');
 assert.equal(await page.locator('#point-0').inputValue(),'34414 Warburg, Germany');
 await page.locator('.hub-toggle[data-role="A"]').click();assert.ok(await page.locator('#hub-panel-A').isHidden());
 await page.locator('.hub-toggle[data-role="A"]').click();assert.equal(calls,1);
 await page.locator('.hub-toggle[data-role="B"]').click();await page.locator('#hub-panel-B .hub-chip').first().waitFor();
 assert.equal(JSON.parse(sent.messages[1].content).anchor,'39-100 Ropczyce, Poland');assert.equal(calls,2);
 await page.screenshot({path:artifactPath('route-hub-suggestions.png')});
 await page.locator('#point-1').fill('Poznań, Poland');assert.ok(await page.locator('#hub-panel-A').isHidden());assert.ok(await page.locator('#hub-panel-B').isHidden());
 hold=true;await page.locator('.hub-toggle[data-role="A"]').click();await page.waitForTimeout(100);
 assert.equal(await page.locator('.hub-toggle[data-role="A"]').getAttribute('aria-busy'),'true');
 await page.locator('#point-0').fill('Błonie, Poland');release();
 await page.waitForTimeout(100);assert.equal(await page.locator('.hub-chip').count(),0);
 await page.goto(root+'options.html');await page.waitForFunction(()=>!document.querySelector('#save-settings').disabled);
 assert.equal(await page.locator('#hub-model').inputValue(),'openai/gpt-oss-120b');
 await page.locator('#hub-suggestions-options > summary').click();
 await page.locator('#hub-model').selectOption('openai/gpt-oss-20b');await page.locator('#save-settings').click();
 await page.waitForFunction(()=>document.querySelector('#settings-status').textContent.includes('zapisane'));
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#save-settings').disabled);
 assert.equal(await page.locator('#hub-model').inputValue(),'openai/gpt-oss-20b');assert.equal(await page.locator('#prompt-preview').inputValue(),'Custom prompt');
 assert.deepEqual(errors,[]);console.log('PASS: endpoint-only controls, A/B anchoring, flex results, toggle cache, invalidation and cancellation, independent model persistence, custom prompt retained.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
