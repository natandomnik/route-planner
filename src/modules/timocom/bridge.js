'use strict';
// The isolated content script can request only these two fixed destinations.
function validTimocomPoints(points) {
  return Array.isArray(points)&&points.length>=2&&points.length<=11&&points.every(point=>typeof point==='string'&&point.length<=300&&/^[A-Z]{2} \S/.test(point)&&!/[\x00-\x1f\x7f]/.test(point));
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.type!=='route-planner/timocom-open') return;
  (async()=>{
    if(sender.id!==chrome.runtime.id||new URL(sender.url).origin!=='https://my.timocom.com'||!validTimocomPoints(message.points)||!['planner','google'].includes(message.target)) throw new Error('Invalid request');
    const {routeSettings}=await chrome.storage.local.get('routeSettings');
    if(routeSettings?.modules?.timocom===false) throw new Error('Disabled module');
    if(message.target==='planner') await openReview(message.points.join('\n'),message.points);
    else {
      const url=new URL('https://www.google.com/maps/dir/');
      url.search=new URLSearchParams({api:'1',origin:message.points[0],destination:message.points.at(-1),travelmode:'driving'});
      if(message.points.length>2) url.searchParams.set('waypoints',message.points.slice(1,-1).join('|'));
      await chrome.tabs.create({url:url.href});
    }
    respond({ok:true});
  })().catch(()=>respond({ok:false}));
  return true;
});
