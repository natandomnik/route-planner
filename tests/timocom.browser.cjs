const {chromium}=require('playwright');
const {launchOptions}=require('./helpers/browser.cjs');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch(launchOptions());
 try {
  const page=await browser.newPage();
  await page.route('**/*',route=>route.abort());
  await page.setContent('<main id="offers"></main>');
  await page.evaluate(()=>{
   window.sent=[];window.chrome={runtime:{sendMessage:async message=>{window.sent.push(message);return {ok:true};}},storage:{local:{get:async()=>({routeSettings:{modules:{timocom:true}}})},onChanged:{addListener(fn){window.settingsChanged=fn;}}}};
   window.addOffer=(id,city)=>{
    const offer=document.createElement('section');offer.id=id;
    for(const [i,country,address] of [[0,'DE',', 10115 Berlin'],[1,'PL',', 00-001 '+city]]) {
     const row=document.createElement('div');
     for(const [field,text] of [['Country',country],['City',address]]) {const span=document.createElement('span');span.dataset.testid='LoadingPlacesView/loadingPlace'+field+'_'+i;span.textContent=text;row.append(span);}
     offer.append(row);
    }
    const map=document.createElement('div');map.className='LoadingPlacesMapImage_mapContainer__test';offer.append(map);document.querySelector('#offers').append(offer);
   };
   addOffer('first','Warszawa');addOffer('second','Testowo');
  });
  await page.addScriptTag({path:path.resolve('src/modules/timocom/content.js')});
  await page.getByRole('button',{name:'Road Planner'}).first().click();
  assert.deepEqual(await page.evaluate(()=>sent[0].points),['DE 10115 Berlin','PL 00-001 Warszawa']);
  await page.getByRole('button',{name:'Google Maps'}).nth(1).click();
  assert.deepEqual(await page.evaluate(()=>sent[1].points),['DE 10115 Berlin','PL 00-001 Testowo']);
  await page.evaluate(()=>document.querySelector('#first [data-testid="LoadingPlacesView/loadingPlaceCity_1"]').textContent=', 30-001 Kraków');
  await page.getByRole('button',{name:'Road Planner'}).first().click();
  assert.equal(await page.evaluate(()=>sent[2].points[1]),'PL 30-001 Kraków');
  await page.evaluate(()=>settingsChanged({routeSettings:{newValue:{modules:{timocom:false}}}},'local'));
  assert.equal(await page.locator('.route-planner-timocom-actions').count(),0);
  await page.evaluate(()=>settingsChanged({routeSettings:{newValue:{modules:{timocom:true}}}},'local'));
  assert.equal(await page.locator('.route-planner-timocom-actions').count(),2);
  console.log('PASS: scoped offers, current DOM addresses, separate destinations, disabling and re-enabling.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
