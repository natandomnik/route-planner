const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(require('./helpers/browser.cjs').launchOptions());
 try {
  const page=await browser.newPage();
  await page.route('http://localhost/**',route=>route.fulfill({contentType:'text/html',body:'<html></html>'}));
  await page.goto('http://localhost/');
  await page.evaluate(()=>{window.chrome={runtime:{getManifest:()=>({version:'test'})}};});
  await page.addScriptTag({path:'src/modules/recognition-history/history.js'});
  const result=await page.evaluate(async()=>{
   const settings={modules:{recognitionHistory:true},provider:'groq',model:'demo',apiKey:'must-not-persist'};
   const id=await RecognitionHistory.start('A -> B',settings);
   await RecognitionHistory.update(id,{aiPoints:['A','B']});
   const row=(await RecognitionHistory.list())[0];
   await RecognitionHistory.update(id,{text:'redacted'});
   const edited=(await RecognitionHistory.list())[0];
   const demo=await RecognitionHistory.start('demo',{...settings,provider:'offline'});
   const disabled=await RecognitionHistory.start('off',{...settings,modules:{recognitionHistory:false}});
   await RecognitionHistory.remove(id);await RecognitionHistory.remove(demo);
   await RecognitionHistory.update(id,{text:'must not resurrect'});
   return {row,edited,demo,disabled,remaining:(await RecognitionHistory.list()).length};
  });
  assert.equal(result.row.trigger,'recognize_ai_click');assert.equal(result.row.text,'A -> B');
  assert.equal(result.row.aiPoints,undefined);assert.equal(result.row.localPoints,undefined);assert.equal(result.row.correctedPoints,undefined);
  assert.equal(result.edited.text,'redacted');assert.equal(result.row.apiKey,undefined);assert.ok(result.demo);assert.equal(result.disabled,null);assert.equal(result.remaining,0);
  console.log('PASS: raw input only, optional collection, no model results/secrets, text redaction, deletion.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
