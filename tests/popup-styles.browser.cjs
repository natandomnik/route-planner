const {chromium}=require('playwright');
const {launchOptions,artifactPath}=require('./helpers/browser.cjs');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch(launchOptions());
 try {
  const page=await browser.newPage({viewport:{width:550,height:950}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const data={routeSettings:{mode:'ai',provider:'offline',strategy:'corridor'}};
   const area={get:async key=>({[key]:data[key]}),set:async values=>Object.assign(data,values),remove:async key=>delete data[key]};
   window.chrome={storage:{local:area,session:area,onChanged:{addListener(){}}}};
   window.copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied.push(text)}});
  });
  await page.goto('file://'+path.resolve('popup.html'));
  assert.ok((await page.locator('main').boundingBox()).height < 500, 'Empty planner should be compact');
  await page.locator('#source').fill('DE 34414 Warburg -> PL 39-100 Ropczyce');
  await page.locator('.hub-toggle[data-role="A"]').click();
  await page.locator('#hub-panel-B .hub-chip').first().waitFor();
  assert.equal(await page.locator('header').evaluate(el=>getComputedStyle(el).display),'flex');
  assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontSize),'25px');
  const chip=page.locator('#hub-panel-A .hub-chip').first();
  const before=await chip.boundingBox();
  assert.ok(before.height <= 32, 'Single-line suggestions should remain compact');
  await chip.locator('.hub-map-link').hover();
  assert.equal(await chip.locator('.hub-map-arrow').evaluate(el=>getComputedStyle(el).visibility),'visible');
  assert.equal((await chip.boundingBox()).width,before.width);
  const url=new URL(await chip.locator('a').getAttribute('href'));assert.ok(url.searchParams.get('origin').includes('Warburg'));
  await chip.locator('button').click();
  assert.equal((await chip.boundingBox()).width,before.width);
  assert.equal(await page.evaluate(()=>window.copied.length),1);
  for(const width of [550,360]) {
   await page.setViewportSize({width,height:950});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.setViewportSize({width:550,height:600});
  const footerBefore=await page.locator('.maps-actions').boundingBox();
  await page.locator('.planner-scroll').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  const footerAfter=await page.locator('.maps-actions').boundingBox();
  assert.equal(footerBefore.y,footerAfter.y);assert.ok(footerAfter.y+footerAfter.height<=600);
  await page.setViewportSize({width:550,height:950});
  await page.screenshot({path:artifactPath('popup-styles-fixed.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: CSS applied, responsive layout, arrow hover, map origin, copy without layout shift.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
