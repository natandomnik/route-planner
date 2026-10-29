const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function bridge(enabled=true) {
 let handler;const opened=[],reviews=[];
 const context=vm.createContext({URL,URLSearchParams,chrome:{runtime:{id:'test-extension',onMessage:{addListener:fn=>{handler=fn;}}},storage:{local:{get:async()=>({routeSettings:{modules:{timocom:enabled}}})}},tabs:{create:async options=>opened.push(options)}},openReview:async(...args)=>reviews.push(args)});
 vm.runInContext(fs.readFileSync('src/modules/timocom/bridge.js','utf8'),context);
 return {opened,reviews,send:(message,sender={id:'test-extension',url:'https://my.timocom.com/offer/fixture'})=>new Promise(resolve=>handler(message,sender,resolve))};
}
const request={type:'route-planner/timocom-open',target:'google',points:['DE 10115 Berlin','DE 01067 Dresden','PL 00-001 Warszawa']};
test('TimoCom bridge preserves ordered stops and limits destinations to fixed URLs',async()=>{
 const b=bridge();assert.equal((await b.send(request)).ok,true);
 const url=new URL(b.opened[0].url);
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('origin'),request.points[0]);assert.equal(url.searchParams.get('waypoints'),request.points[1]);assert.equal(url.searchParams.get('destination'),request.points[2]);
 assert.equal((await b.send({...request,target:'planner'})).ok,true);
 assert.deepEqual(b.reviews[0],[request.points.join('\n'),request.points]);
});
test('TimoCom bridge rejects disabled modules, foreign senders and malformed input',async()=>{
 const disabled=bridge(false);assert.equal((await disabled.send(request)).ok,false);assert.equal(disabled.opened.length,0);
 const b=bridge();
 for(const sender of [{id:'other',url:'https://my.timocom.com/'},{id:'test-extension',url:'https://my.timocom.com.evil.example/'},{id:'test-extension',url:'invalid'}]) assert.equal((await b.send(request,sender)).ok,false);
 for(const patch of [{target:'https://example.com'},{points:['DE Berlin']},{points:['DE Berlin\nextra','PL Warszawa']},{points:Array(12).fill('PL Warszawa')}]) assert.equal((await b.send({...request,...patch})).ok,false);
 assert.equal(b.opened.length,0);assert.equal(b.reviews.length,0);
});
