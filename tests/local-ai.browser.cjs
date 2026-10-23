const {launchOptions, artifactPath}=require('./helpers/browser.cjs');
// Run with Playwright available in NODE_PATH. Uses an isolated profile and fake API responses.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch(launchOptions());
 try {
  const context=await browser.newContext({viewport:{width:600,height:1100}});
  // Keep the fake extension storage outside the document, as Chrome does.
  // file:// localStorage persistence differs between browser builds.
  const stored={routeSettings:{mode:'ai',provider:'groq',profiles:{groq:{model:'openai/gpt-oss-20b',apiKey:'fake-key'}}}};
  await context.exposeBinding('testStorageGet',(_source,key)=>({[key]:stored[key]}));
  await context.exposeBinding('testStorageSet',(_source,value)=>{Object.assign(stored,value);});
  await context.exposeBinding('testStorageRemove',(_source,key)=>{delete stored[key];});
  await context.addInitScript(()=>{
   const area={get:k=>window.testStorageGet(k),set:v=>window.testStorageSet(v),remove:k=>window.testStorageRemove(k)};
   window.updated=[];
   Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text=>{window.copiedText=text;}}});
   window.chrome={storage:{local:area,session:area,onChanged:{addListener:()=>{}}},tabs:{getCurrent:async()=>({id:42}),update:async(id,options)=>updated.push({id,...options})}};
  });
  let calls=0,code=200, sent, hold=false, release;
  await context.route('https://api.groq.com/**',async route=>{
   const request=route.request().postDataJSON();
   if(request.tools){await route.fulfill({status:429,json:{}});return;}
   calls++;sent=request;
   if(hold)await new Promise(r=>release=r);
   await route.fulfill({status:code,json:code===200?{choices:[{finish_reason:'stop',message:{content:JSON.stringify({points:['02826, Germany','59-900, Poland','05-870, Poland'],warnings:[]})}}]}:{error:{message:'quota'}}}).catch(()=>{});
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const root='file://'+path.resolve(__dirname,'..')+'/';
  await page.goto(root+'popup.html');
  const input='de 02826 do pl 05 870';
  await page.locator('#source').fill(input);
  await page.waitForFunction(()=>document.querySelector('#recognition').textContent==='Rozpoznano lokalnie');
  assert.equal(calls,0);assert.equal(await page.locator('.point').count(),2);
  await page.locator('#point-0').fill('Ręczna poprawka');
  await page.locator('#copy-points').click();
  await page.waitForFunction(()=>typeof window.copiedText==='string');
  assert.equal(await page.evaluate(()=>window.copiedText),'Ręczna poprawka\nPL 05-870');
  assert.equal(await page.locator('[data-map-link]').count(),0);
  await page.locator('#point-0').fill('');
  assert.ok(await page.locator('#copy-points').isDisabled());
  await page.locator('#point-0').fill('Ręczna poprawka');
  await page.locator('#parse-ai').click();
  await page.waitForFunction(()=>document.querySelector('#recognition').textContent.includes('Rozpoznano przez AI'));
  assert.equal(calls,1);assert.equal(sent.messages[1].content,input);assert.equal(await page.locator('.point').count(),3);
  await page.locator('#open').click();
  const url=new URL((await page.evaluate(()=>updated))[0].url);
  assert.equal(url.searchParams.get('origin'),'02826, Germany');assert.equal(url.searchParams.get('waypoints'),'59-900, Poland');assert.equal(url.searchParams.get('destination'),'05-870, Poland');
  await page.locator('#undo-ai').click();assert.equal(await page.locator('#point-0').inputValue(),'Ręczna poprawka');
  code=429;await page.locator('#parse-ai').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Dotychczasowe'));
  assert.equal(await page.locator('#point-0').inputValue(),'Ręczna poprawka');assert.ok(await page.locator('#open').isEnabled());
  await page.reload();await page.locator('#point-0').waitFor();assert.equal(calls,2);assert.equal(await page.locator('#point-0').inputValue(),'Ręczna poprawka');
  code=200;hold=true;await page.locator('#parse-ai').click();await page.waitForTimeout(100);
  await page.locator('#source').fill('PL 05 870 > DE 02826 > PL 05-870');release();
  await page.waitForFunction(()=>document.querySelector('#recognition').textContent==='Rozpoznano lokalnie');
  assert.equal(await page.locator('#point-0').inputValue(),'05-870, Poland');assert.equal(await page.locator('.point').count(),3);
  await page.locator('#clear').click();await page.waitForTimeout(400);assert.ok(await page.locator('#result').isHidden());assert.ok(await page.locator('#parse-ai').isDisabled());
  await page.evaluate(()=>chrome.storage.session.set({'selection-test':{text:'loading: DE 02826\nunloading: PL 59 900\nunloading: PL 05 870'}}));
  const selection=await context.newPage();await selection.goto(root+'popup.html?selection=test');await selection.locator('#point-2').waitFor();assert.equal(calls,3);
  assert.equal(await selection.locator('#point-1').inputValue(),'59-900, Poland');
  await selection.screenshot({path:artifactPath('route-local-ai.png')});
  assert.deepEqual(errors,[]);console.log('PASS: local on input and selection without API, explicit AI on original text, waypoints, undo manual edits, failure preservation, reload without API, canceled stale result, clear.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
