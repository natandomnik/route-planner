const {chromium}=require('playwright');const {launchOptions}=require('./helpers/browser.cjs');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{const browser=await chromium.launch(launchOptions());try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});let calls=0;
 await page.addInitScript(()=>{const data={mapApiKey:'test-only',routeSettings:{}};const area={get:async k=>({[k]:data[k]}),set:async v=>Object.assign(data,v)};window.chrome={storage:{local:area,session:area,onChanged:{addListener(){}}}};});
 await page.route('https://api.geoapify.com/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('/routing')) {
   const coordinates=url.searchParams.get('waypoints').split('|').map(p=>p.split(',').map(Number).reverse());
   await route.fulfill({json:{features:[{properties:{distance:123450},geometry:{type:'MultiLineString',coordinates:[coordinates]}}]}});return;
  }
  calls++;await route.fulfill({json:{results:[{city:url.searchParams.get('city')||url.searchParams.get('text'),lat:51+calls*.1,lon:16.9+calls*.1,rank:{confidence:1}}]}});
 });
 await page.route('https://maps.geoapify.com/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('popup.html'));
 await page.waitForFunction(()=>!document.querySelector('#suggestion-strategy button').disabled);
 await page.evaluate(()=>SuggestionMap.update({route:['A town','B town'],suggestions:[]},true));
 assert.equal(await page.locator('#map-toggle').isVisible(),true);
 assert.equal(calls,0);
 await page.locator('#map-toggle').click();
 await page.waitForFunction(()=>document.querySelector('#map-status').textContent.startsWith('Punkty zlokalizowane'));
 assert.equal(await page.locator('#route-distance').innerText(),'123,5 km');
 assert.equal(await page.locator('.map-distance-badge').innerText(),'123,5 km');
 assert.equal(await page.locator('.main-route-line').getAttribute('stroke'),'#1a73e8');
 await page.evaluate(()=>{window.originalMapPane=document.querySelector('.leaflet-map-pane');window.originalMainLine=document.querySelector('.main-route-line');window.originalEndpoint=document.querySelector('.endpoint-a');});
 await page.evaluate(()=>SuggestionMap.update({route:['A town','B town'],suggestions:[{role:'A',label:'H1',text:'Third town',item:{roadKm:45}}]},true));
 await page.waitForFunction(()=>document.querySelectorAll('.suggestion-map-point').length===1 && document.querySelector('#map-status').textContent.startsWith('Punkty zlokalizowane'));
 assert.equal(await page.locator('#map-panel').isVisible(),true);
 assert.ok(await page.evaluate(()=>window.originalMapPane===document.querySelector('.leaflet-map-pane') && window.originalMainLine===document.querySelector('.main-route-line') && window.originalEndpoint===document.querySelector('.endpoint-a')));
 assert.ok(await page.locator('.country-border').count()>0);
 assert.ok(await page.locator('.context-city').count()>0);
 assert.equal(await page.locator('.route-map-tooltip').count(),0);
 await page.locator('.endpoint-a').hover();
 await page.waitForFunction(()=>[...document.querySelectorAll('.route-map-tooltip')].some(el=>el.textContent.includes('A town')));
 await page.locator('.map-heading').hover();
 await page.locator('.route-map-tooltip').waitFor({state:'detached'});
 await page.evaluate(()=>SuggestionMap.highlight({role:'A',label:'H1',text:'Third town'}));
 assert.equal(await page.locator('.suggestion-road').getAttribute('stroke'),'#00b963');
 assert.equal(await page.locator('.route-distance-label').count(),0);
 assert.ok((await page.locator('.leaflet-tooltip').allTextContents()).some(t=>t.includes('Third town')));
 assert.equal(await page.locator('path[fill="#00d878"][stroke-width="4"]').count(),1);
 await page.evaluate(()=>SuggestionMap.highlight(null));
 await page.locator('.route-distance-label').waitFor({state:'detached'});
 assert.equal(await page.locator('.route-distance-label').count(),0);
 assert.equal(await page.locator('path[fill="#00d878"][stroke-width="4"]').count(),0);
 assert.equal(calls,3);assert.equal(await page.locator('.route-endpoint-marker').count(),2);
 assert.equal(await page.locator('.main-route-line').getAttribute('stroke-width'),'5');


 assert.ok(await page.locator('.leaflet-control-attribution').innerText().then(t=>t.includes('Geoapify')));
 await page.locator('#map-close').click();assert.equal(await page.locator('#map-panel').isHidden(),true);
 await page.locator('#map-toggle').click();await page.waitForFunction(()=>document.querySelector('#map-status').textContent.startsWith('Punkty zlokalizowane'));assert.equal(calls,3);
 await page.evaluate(()=>SuggestionMap.update(null,false));assert.equal(await page.locator('#map-toggle').isHidden(),true);assert.equal(await page.locator('#map-panel').isHidden(),true);
 assert.deepEqual(errors,[]);console.log('PASS: lazy map loading, mocked markers/relations, attribution, close, cache, disabling.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
