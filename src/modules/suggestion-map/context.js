'use strict';
// Bundled cartographic context, independent of geocoding and vehicle availability.
function addMapContext(map) {
  for (const [name,zIndex] of [['countryContext',310],['cityContext',360]]) {
    map.createPane(name);map.getPane(name).style.zIndex=String(zIndex);map.getPane(name).style.pointerEvents='none';
  }
  const borderHalo=L.geoJSON(MAP_CONTEXT_DATA.borders,{pane:'countryContext',interactive:false,style:{color:'#fffef9',weight:6,opacity:.95}}).addTo(map);
  const borders=L.geoJSON(MAP_CONTEXT_DATA.borders,{pane:'countryContext',interactive:false,style:feature=>({color:'#544460',weight:3,opacity:.95,dashArray:feature.properties.disputed?'7 5':null,className:'country-border'})}).addTo(map);
  const cities=L.layerGroup().addTo(map);
  const normalize=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const candidates=MAP_CONTEXT_DATA.cities.map(city=>({...city,minZoom:city.population>=1000000?3:city.capital?5:city.population>=500000?6:7}));
  for(const place of MAP_LOGISTICS_PLACES) {
    const existing=candidates.find(city=>normalize(city.name)===normalize(place.name)&&Math.abs(city.point[0]-place.point[0])<.2&&Math.abs(city.point[1]-place.point[1])<.2);
    if(existing) { existing.logistics=true;existing.source=place.source; }
    else candidates.push(place);
  }
  candidates.push(...MAP_TRUCK_PARKINGS);
  // Smaller logistics towns gain priority only after their zoom threshold is reached.
  const priority=(city,zoom)=>(city.parking?2e8:zoom>=8&&city.logistics?1e8:0)+(city.population||0);
  function render() {
    cities.clearLayers();
    const zoom=map.getZoom(),bounds=map.getBounds(),size=map.getSize(),occupied=[];
    let parkingCount=0;
    // Generalized boundaries are for regional orientation, not street-level precision.
    borderHalo.setStyle({weight:zoom>=11?4:6,opacity:zoom>=11?.65:.95});
    borders.setStyle({weight:zoom>=11?2:3,opacity:zoom>=11?.65:.95});
    const limit=Math.min(zoom<7?18:zoom<9?28:40,Math.max(6,Math.floor(size.x*size.y/14000)));
    for(const city of [...candidates].sort((a,b)=>priority(b,zoom)-priority(a,zoom))) {
      if(!bounds.contains(city.point) || zoom<city.minZoom || (city.parking && parkingCount>=Math.ceil(limit/2))) continue;
      const point=map.latLngToContainerPoint(city.point),font=zoom<8&&(city.capital||city.population>=1000000)?16:city.logistics?14:13;
      const width=Math.min(260,city.name.length*font*.6+(city.parking?32:22));
      const box={left:point.x-6,top:point.y-12,right:point.x+width,bottom:point.y+12};
      if(box.left<0 || box.right>size.x || box.top<0 || box.bottom>size.y || occupied.some(b=>box.left<b.right+10&&box.right>b.left-10&&box.top<b.bottom+8&&box.bottom>b.top-8)) continue;
      occupied.push(box);if(city.parking) parkingCount++;
      const label=document.createElement('span');label.className='context-city-name'+(city.parking?' context-parking-name':city.logistics?' context-logistics-name':'');label.textContent=city.name;label.style.fontSize=font+'px';label.style.maxWidth=width+'px';
      label.setAttribute('aria-label',city.parking?'Parking ciężarowy: '+city.fullName:city.name);
      L.marker(city.point,{pane:'cityContext',interactive:false,keyboard:false,icon:L.divIcon({className:'context-city',html:label,iconSize:[width,24],iconAnchor:[6,12]})}).addTo(cities);
      if(occupied.length>=limit) break;
    }
  }
  map.on('moveend zoomend resize',render);render();
  map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>');
  map.once('unload',()=>map.off('moveend zoomend resize',render));
}
