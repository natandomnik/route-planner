const {chromium}=require('playwright');const {launchOptions}=require('./helpers/browser.cjs');
const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch(launchOptions());
 try {
 const page=await browser.newPage();let calls=0,release;
 await page.addInitScript(()=>{
  const data=JSON.parse(localStorage.getItem('modules-test')||'{"routeSettings":{"mode":"ai","provider":"groq","customPrompt":"Preserve this prompt","profiles":{"groq":{"apiKey":"fake-key"}},"modules":{"aiExtraction":false,"postalLookup":false,"hubSuggestions":false,"postalLab":false}}}');
  const listeners=[];
  const area={get:async k=>({[k]:data[k]}),set:async obj=>{Object.assign(data,obj);localStorage.setItem('modules-test',JSON.stringify(data));for(const fn of listeners)fn(Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,{newValue:v}])),'local');},remove:async k=>delete data[k]};
  window.chrome={storage:{local:area,session:area,onChanged:{addListener:fn=>listeners.push(fn)}}};
  window.copies=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>copies.push(t)}});
 });
 await page.route('https://api.groq.com/**',async route=>{calls++;await new Promise(r=>release=r);await route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'{"suggestions":[]}'}}]}}).catch(()=>{});});
 const root='file://'+path.resolve(__dirname,'..')+'/';
 await page.goto(root+'popup.html');await page.locator('#source').fill('DE Siegen -> PL Ropczyce');
 await page.waitForFunction(()=>!document.querySelector('#copy-points').disabled);
 assert.ok(await page.locator('#parse-ai').isHidden());assert.ok(await page.locator('.hub-toggle').first().isHidden());
 await page.locator('#source').press('Control+Enter');await page.locator('#copy-points').click();await page.waitForFunction(()=>copies.length===1);
 assert.equal(calls,0);assert.equal(await page.evaluate(()=>copies[0]),'DE Siegen\nPL Ropczyce');
 await page.goto(root+'postal-lab.html');await page.locator('#run-postal-test').click();await page.waitForFunction(()=>document.querySelector('#postal-test-status').textContent.includes('wyłączony'));assert.equal(calls,0);
 await page.goto(root+'options.html');await page.waitForFunction(()=>!document.querySelector('#save-settings').disabled);
 assert.equal(await page.locator('#module-postalLookup').isChecked(),false);
 await page.locator('#module-hubSuggestions').check();await page.locator('#save-settings').click();await page.waitForFunction(()=>document.querySelector('#settings-status').textContent.includes('zapisane'));
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#save-settings').disabled);
 assert.ok(await page.locator('#module-hubSuggestions').isChecked());assert.equal(await page.locator('#module-postalLookup').isChecked(),false);assert.equal(await page.locator('#prompt-preview').inputValue(),'Preserve this prompt');
 await page.goto(root+'popup.html');await page.locator('#point-0').waitFor();await page.locator('.hub-toggle').first().click();await page.waitForTimeout(100);
 assert.equal(calls,1);
 await page.evaluate(async()=>{const {routeSettings}=await chrome.storage.local.get('routeSettings');routeSettings.modules.hubSuggestions=false;await chrome.storage.local.set({routeSettings});});
 release();await page.waitForFunction(()=>document.querySelector('.hub-toggle').hidden);
 assert.ok(await page.locator('#hub-panel-A').isHidden());
 console.log('PASS: disabled modules make no requests, local editing/copy survive, settings persist, pending hub request is discarded on disable.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
