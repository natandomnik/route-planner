const {chromium}=require('playwright');const {launchOptions}=require('./helpers/browser.cjs');
const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch(launchOptions());
 try {
 const page=await browser.newPage();let calls=0,release;
 const data={"routeSettings":{"mode":"ai","provider":"groq","customPrompt":"Preserve this prompt","profiles":{"groq":{"apiKey":"fake-key"}},"modules":{"aiExtraction":false,"postalLookup":false,"hubSuggestions":false,"postalLab":false}}};
 await page.exposeBinding('testStorageGet',(_source,k)=>({[k]:data[k]}));
 await page.exposeBinding('testStorageSet',(_source,v)=>{Object.assign(data,v);});
 await page.exposeBinding('testStorageRemove',(_source,k)=>{delete data[k];});
 await page.addInitScript(()=>{
  const listeners=[];
  const area={get:k=>window.testStorageGet(k),set:async obj=>{await window.testStorageSet(obj);for(const fn of listeners)fn(Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,{newValue:v}])),'local');},remove:k=>window.testStorageRemove(k)};
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
 assert.ok(await page.locator('#hub-suggestions-options').isHidden());
 assert.ok(await page.locator('#ai-instructions').isHidden());
 assert.ok(await page.locator('#postal-lab-options').isHidden());
 assert.ok(await page.locator('#postal-lookup-options').isHidden());
 await page.locator('#module-hubSuggestions').check();
 assert.ok(await page.locator('#hub-suggestions-options').isVisible());
 await page.locator('#module-aiExtraction').check();
 assert.ok(await page.locator('#ai-instructions').isVisible());
 await page.locator('#module-postalLab').check();
 assert.ok(await page.locator('#postal-lab-options').isVisible());
 await page.locator('#postal-lab-options > summary').click();
 assert.ok(await page.locator('#postal-lab-link').isVisible());
 await page.locator('#module-postalLookup').check();
 assert.ok(await page.locator('#postal-lookup-options').isVisible());
 await page.locator('#module-aiExtraction').uncheck();
 assert.ok(await page.locator('#ai-instructions').isHidden());
 await page.locator('#module-postalLab').uncheck();
 assert.ok(await page.locator('#postal-lab-options').isHidden());
 await page.locator('#module-postalLookup').uncheck();
 assert.ok(await page.locator('#postal-lookup-options').isHidden());
 await page.locator('#save-settings').click();await page.waitForFunction(()=>document.querySelector('#settings-status').textContent.includes('zapisane'));
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#save-settings').disabled);
 assert.ok(await page.locator('#module-hubSuggestions').isChecked());
 assert.ok(await page.locator('#hub-suggestions-options').isVisible());
 assert.ok(await page.locator('#ai-instructions').isHidden());
 assert.equal(await page.locator('#module-postalLookup').isChecked(),false);
 assert.equal(await page.locator('#prompt-preview').inputValue(),'Preserve this prompt');

 assert.equal(await page.locator('#provider').inputValue(), 'groq');
 assert.equal(await page.locator('#api-key').inputValue(), 'fake-key');
 assert.ok((await page.locator('#saved-key-preview').textContent()).includes('••••'));

 await page.locator('#provider').selectOption('gemini');
 assert.equal(await page.locator('#api-key').inputValue(), '');
 assert.equal(await page.locator('#model').inputValue(), 'gemini-3.1-flash-lite');
 assert.ok(await page.locator('#custom-model-box').isHidden());
 assert.ok((await page.locator('#saved-key-preview').textContent()).includes('Brak zapisanego klucza dla: Google Gemini'));

 await page.locator('#api-key').fill('AIzaSyTestGeminiKey1234');
 assert.ok((await page.locator('#saved-key-preview').textContent()).includes('AIzaSy••••••••1234'));

 await page.locator('#provider').selectOption('openai');
 assert.equal(await page.locator('#api-key').inputValue(), '');
 assert.equal(await page.locator('#model').inputValue(), 'gpt-6-luna');
 assert.ok(await page.locator('#custom-model-box').isHidden());
 assert.ok((await page.locator('#saved-key-preview').textContent()).includes('Brak zapisanego klucza dla: OpenAI'));

 await page.locator('#provider').selectOption('gemini');
 assert.equal(await page.locator('#api-key').inputValue(), 'AIzaSyTestGeminiKey1234');
 assert.equal(await page.locator('#model').inputValue(), 'gemini-3.1-flash-lite');

 await page.locator('#provider').selectOption('groq');
 assert.equal(await page.locator('#api-key').inputValue(), 'fake-key');
 await page.goto(root+'popup.html');await page.locator('#point-0').waitFor();await page.locator('.hub-toggle').first().click();await page.waitForTimeout(100);
 assert.equal(calls,1);
 await page.evaluate(async()=>{const {routeSettings}=await chrome.storage.local.get('routeSettings');routeSettings.modules.hubSuggestions=false;await chrome.storage.local.set({routeSettings});});
 release();await page.waitForFunction(()=>document.querySelector('.hub-toggle').hidden);
 assert.ok(await page.locator('#hub-panel-A').isHidden());
 console.log('PASS: disabled modules make no requests, local editing/copy survive, settings persist, pending hub request is discarded on disable.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
