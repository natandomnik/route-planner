'use strict';
const SuggestionMap = (() => {
  let snapshot = null, signature = '', map = null, controller = null;
  const layers = new Map();
  let highlighted = null;
  let appendSuggestions = null;
  let viewBounds = {all:[], A:[], B:[]};
  function focusArea(role) {
    const bounds = viewBounds[role];
    if (map && bounds?.length) map.fitBounds(bounds,{padding:[24,24],maxZoom:12,animate:false});
  }
  const recordKey = record => JSON.stringify([record.role, record.label, record.text]);
  function highlight(record) {
    const next = record ? recordKey(record) : null;
    if (highlighted === next) return;
    const previous = layers.get(highlighted);
    if (previous) { previous.marker.setRadius(7); previous.marker.setStyle({weight:2,fillColor:'#ff3838'}); previous.marker.getElement()?.classList.remove('suggestion-highlighted'); previous.marker.closeTooltip(); previous.line?.setStyle({weight:4,opacity:.9,color:'#ef3535'}); }
    highlighted = next;
    const current = layers.get(next);
    if (current) {
      current.marker.setRadius(10); current.marker.setStyle({weight:4,fillColor:'#00d878'}); current.marker.getElement()?.classList.add('suggestion-highlighted'); current.marker.bringToFront();
      current.line?.setStyle({weight:6,opacity:1,color:'#00b963'}); current.line?.bringToFront();
      // Hover highlights a suggestion without changing the user's zoom or position.
      current.marker.openTooltip();

    }
  }
  function categoryColor(category) {
    const token = {approach:'--map-approach',route:'--map-route',hub:'--map-hub',exit:'--map-exit',radius:'--map-radius'}[category] || '--map-radius';
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  }
  const trigger = document.getElementById('map-toggle');
  const panel = document.getElementById('map-panel');
  const status = document.getElementById('map-status');
  function close() {
    controller?.abort(); controller = null; appendSuggestions = null;
    layers.clear(); highlighted = null; viewBounds = {all:[],A:[],B:[]};
    map?.remove(); map = null; mapDistanceBadge=null;
    panel.hidden = true; document.body.classList.remove('map-open');
    trigger.setAttribute('aria-expanded','false');
  }
  let distanceKey='', distanceTimer=null, distanceController=null;
  const distanceOutput=document.getElementById('route-distance');
  let mapDistanceBadge=null;
  function syncDistanceBadge() {
    const text=distanceOutput.textContent;
    const isDistance=/\d.* km$/.test(text);
    distanceOutput.classList.toggle('distance-ready',isDistance);
    if(mapDistanceBadge) {mapDistanceBadge.textContent=isDistance?text:'';mapDistanceBadge.hidden=!isDistance;}
  }
  new MutationObserver(syncDistanceBadge).observe(distanceOutput,{childList:true,characterData:true,subtree:true});
  function updateDistance(route, enabled) {
    const key=enabled?JSON.stringify(route):'';
    if(key===distanceKey) return;
    distanceKey=key;clearTimeout(distanceTimer);distanceController?.abort();distanceOutput.textContent='';
    if(!enabled) return;
    distanceOutput.textContent='Obliczanie odległości…';
    distanceTimer=setTimeout(async()=>{
      const aborter=new AbortController();distanceController=aborter;
      const timeout=setTimeout(()=>aborter.abort(),45000);
      try {
        const {mapApiKey=''}=await chrome.storage.local.get('mapApiKey');
        aborter.signal.throwIfAborted();
        if(!mapApiKey.trim()) {if(key===distanceKey) distanceOutput.textContent='Odległość: dodaj klucz mapy';return;}
        const points=[];
        for(const text of route) {
          const point=await locate({text},mapApiKey.trim(),aborter.signal);
          if(!point) throw new Error('Niepotwierdzona lokalizacja');
          points.push(point);
          await new Promise(resolve=>setTimeout(resolve,300));
          aborter.signal.throwIfAborted();
        }
        const result=await road(points,mapApiKey.trim(),aborter.signal);
        if(key===distanceKey) {
          distanceOutput.textContent=Number.isFinite(result.distance)?(result.distance/1000).toLocaleString('pl-PL',{maximumFractionDigits:1})+' km':'';
          distanceOutput.title='Długość trasy samochodowej Geoapify przez wszystkie podane punkty; bez parametrów ciężarówki.';
        }
      } catch {if(key===distanceKey) distanceOutput.textContent='Odległość niedostępna';}
      finally {clearTimeout(timeout);}
    },600);
  }
  function update(next, enabled) {
    const available=enabled && next?.route?.length>=2 && next.route.every(text=>typeof text==='string' && text.trim());
    updateDistance(next?.route,available);
    const key=JSON.stringify(next), changed=key!==signature;
    const sameRoute=JSON.stringify(snapshot?.route)===JSON.stringify(next?.route) && snapshot?.strategy===next?.strategy && snapshot?.suggestionsEnabled===next?.suggestionsEnabled;
    if(available && changed && sameRoute && !panel.hidden) {
      snapshot=next;signature=key;trigger.hidden=false;
      appendSuggestions?.(next.suggestions || []);
      return;
    }
    const reopen=available && changed && !panel.hidden;
    const viewport=reopen && map?{center:map.getCenter(),zoom:map.getZoom()}:null;
    if(!available || changed) close();
    snapshot=next;signature=key;
    trigger.hidden=!available;
    if(reopen) open(viewport).catch(()=>{status.textContent='Nie udało się odświeżyć mapy.';});
  }
  async function locate(record, key, signal) {
    const wanted=MapLocationValidation.expected(record);
    // Versioned cache deliberately ignores previously accepted, unchecked coordinates.
    const cacheKey='map-location-v3-'+JSON.stringify(wanted);
    const stored=(await chrome.storage.local.get(cacheKey))[cacheKey];
    if(stored && Date.now()-stored.time<30*86400000 && MapLocationValidation.matches(stored.row,wanted)) return [stored.row.lat,stored.row.lon];
    signal.throwIfAborted();
    let unique=[];
    for(const freeform of [false,true]) {
      const params=MapLocationValidation.parameters(record,wanted,freeform);
      // A structured lookup may be retried as free text, but with identical validation.
      if(freeform && MapLocationValidation.parameters(record,wanted).has('text')) break;
      const url=new URL('https://api.geoapify.com/v1/geocode/search');
      params.set('apiKey',key);url.search=params;
      const response=await fetch(url,{signal,redirect:'error'});
      if(!response.ok) throw new Error('Usługa map: HTTP '+response.status+'. Sprawdź klucz i limit.');
      const rows=(await response.json()).results;
      const matches=Array.isArray(rows)?rows.filter(row=>MapLocationValidation.matches(row,wanted)):[];
      unique=[...new Map(matches.map(row=>[row.lat.toFixed(3)+','+row.lon.toFixed(3),row])).values()];
      if(unique.length) break;
    }
    if(unique.length!==1) return null;
    signal.throwIfAborted();
    await chrome.storage.local.set({[cacheKey]:{row:unique[0],time:Date.now()}});
    return [unique[0].lat,unique[0].lon];
  }
  const roadCache=new Map();
  async function road(points,key,signal) {
    const cacheKey=JSON.stringify(points);
    if(roadCache.has(cacheKey)) return roadCache.get(cacheKey);
    const url=new URL('https://api.geoapify.com/v1/routing');
    url.search=new URLSearchParams({waypoints:points.map(p=>p.join(',')).join('|'),mode:'drive',apiKey:key});
    const response=await fetch(url,{signal,redirect:'error'});
    if(!response.ok) throw new Error('Nie udało się wyznaczyć drogi (HTTP '+response.status+').');
    const feature=(await response.json()).features?.[0];
    const geometry=feature?.geometry;
    const lines=geometry?.type==='MultiLineString'?geometry.coordinates:geometry?.type==='LineString'?[geometry.coordinates]:null;
    if(!Array.isArray(lines)||!lines.length||lines.some(line=>!Array.isArray(line)||line.length<2||line.some(p=>!Array.isArray(p)||p.length!==2||!valid([p[1],p[0]])))) throw new Error('Nieprawidłowy przebieg drogi.');
    const coordinates=lines.map(line=>line.map(p=>[p[1],p[0]]));
    signal.throwIfAborted();
    if(roadCache.size>=100) roadCache.delete(roadCache.keys().next().value);
    coordinates.distance=Number.isFinite(feature?.properties?.distance) && feature.properties.distance>=0 ? feature.properties.distance : null;
    roadCache.set(cacheKey,coordinates);return coordinates;
  }
  function valid(point) {return Array.isArray(point) && point.length===2 && point.every(Number.isFinite) && Math.abs(point[0])<=90 && Math.abs(point[1])<=180;}
  async function open(viewport = null) {
    if (!snapshot) return;
    if (!panel.hidden) {close();return;}
    if (!viewport && innerWidth < 900 && !new URLSearchParams(location.search).has('mapSnapshot')) {
      const id = crypto.randomUUID();
      await chrome.storage.session.set({['map-snapshot-'+id]:snapshot});
      await chrome.tabs.create({url:chrome.runtime.getURL('popup.html?mapSnapshot='+id)});return;
    }
    clearTimeout(distanceTimer);distanceController?.abort();
    panel.hidden=false;document.body.classList.add('map-open');trigger.setAttribute('aria-expanded','true');
    const aborter = new AbortController();controller=aborter;
    const timer=setTimeout(()=>aborter.abort(),120000);
    try {
      const {mapApiKey=''}=await chrome.storage.local.get('mapApiKey');
      aborter.signal.throwIfAborted();
      if (!mapApiKey.trim()) {distanceOutput.textContent='Odległość: dodaj klucz mapy';status.textContent='Dodaj klucz Geoapify w Ustawieniach → Mapa sugestii.';return;}
      map=L.map('suggestion-map',{zoomControl:true,zoomSnap:1,zoomDelta:1,wheelPxPerZoomLevel:60,wheelDebounceTime:40,zoomAnimation:true,fadeAnimation:true,markerZoomAnimation:true}).setView([51,15],5);
      const distanceControl=L.control({position:'bottomleft'});
      distanceControl.onAdd=()=>{mapDistanceBadge=L.DomUtil.create('div','map-distance-badge');mapDistanceBadge.setAttribute('aria-label','Odległość trasy');syncDistanceBadge();return mapDistanceBadge;};
      distanceControl.addTo(map);
      addMapContext(map);
      map.createPane('mainRoute'); map.getPane('mainRoute').style.zIndex='450'; map.getPane('mainRoute').style.pointerEvents='none';
      L.tileLayer('https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey='+encodeURIComponent(mapApiKey.trim()),{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · <a href="https://www.geoapify.com/" target="_blank" rel="noopener">Powered by Geoapify</a>'}).on('tileerror',()=>{status.textContent='Nie udało się pobrać części mapy. Sprawdź klucz lub połączenie.';}).addTo(map);
      const current=snapshot, coordinates=new Map(), bounds=[], missing=[], roadFailures=[];
      const records=current.route.map((text,i)=>({text,label:i===0?'A':i===current.route.length-1?'B':String(i),endpoint:true})).concat(current.suggestions);
      const queued=new Set(current.suggestions.map(recordKey));
      let cursor=0, running=false, initialView=true;
      async function pump() {
        if(running || aborter.signal.aborted) return;
        running=true;
        const batchTimeout=setTimeout(()=>aborter.abort(),120000);
        try {
      while (cursor<records.length) {
        const i=cursor++;

        aborter.signal.throwIfAborted();
        const record=records[i];status.textContent='Lokalizowanie punktów '+(i+1)+' / '+records.length+'…';
        const point=coordinates.has(record.text)?coordinates.get(record.text):await locate(record,mapApiKey.trim(),aborter.signal);
        aborter.signal.throwIfAborted();coordinates.set(record.text,point);
        if (!point) {missing.push(record.text);continue;}
        bounds.push(point); viewBounds.all.push(point);
        if (record.endpoint && ['A','B'].includes(record.label)) viewBounds[record.label].push(point);
        else if (!record.endpoint) viewBounds[record.role]?.push(point);
        const category = record.endpoint ? 'approach' : record.category || (record.label.startsWith('H') ? 'hub' : record.label.startsWith('TRASA') ? 'route' : record.label === 'PODJAZD' ? 'approach' : 'exit');
        const tooltip=document.createElement('div'); tooltip.className='map-tooltip-content'; tooltip.dataset.category=category;
        const tag=document.createElement('strong'); tag.textContent=record.label.replace('HUB ','H');
        const text=document.createElement('span'); text.textContent=record.text;
        tooltip.append(tag,text);
        if (Number.isFinite(record.item?.roadKm)) {
          const distance=document.createElement('span'); distance.className='map-tooltip-distance'; distance.textContent='≈ '+Math.round(record.item.roadKm)+' km'; tooltip.append(distance);
        }
        const color = record.endpoint ? categoryColor(category) : '#ff3838';
        const isMain = record.endpoint && ['A','B'].includes(record.label);
        const marker = (isMain
          ? L.marker(point,{zIndexOffset:1000,icon:L.divIcon({className:'route-endpoint-marker endpoint-'+record.label.toLowerCase(),html:record.label,iconSize:[36,36],iconAnchor:[18,18]}),title:record.label+' · '+record.text})
          : L.circleMarker(point,{radius:record.endpoint?8:7,color:'#ffffff',weight:2,fillColor:color,fillOpacity:1,className:'suggestion-map-point'})).bindTooltip(tooltip,{permanent:false,direction:'top',className:'route-map-tooltip',offset:[0,-8],opacity:1}).addTo(map);
        if (!record.endpoint) {
          const anchor=coordinates.get(record.role==='A'?current.route[0]:current.route.at(-1));
          let line=null;
          if(anchor) {
            try {
              const geometry=await road([anchor,point],mapApiKey.trim(),aborter.signal);
              aborter.signal.throwIfAborted();
              line=L.polyline(geometry,{color:'#ef3535',weight:4,opacity:.9,dashArray:'9 7',className:'suggestion-road'}).addTo(map);
            } catch(error) {if(aborter.signal.aborted) throw error;roadFailures.push(record.text);}
          }
          layers.set(recordKey(record),{marker,line,anchor});
          marker.on('mouseover',()=>highlight(record));
          marker.on('mouseout',()=>{if(highlighted===recordKey(record)) highlight(null);});
          line?.on('mouseover',()=>highlight(record));
          line?.on('mouseout',()=>{if(highlighted===recordKey(record)) highlight(null);});
          if (highlighted === recordKey(record)) { highlighted = null; highlight(record); }
        }
        if (record.endpoint && record.label === 'B') {
          const routePoints=current.route.map(text=>coordinates.get(text));
          if(routePoints.every(Boolean)) {
            try {
              const geometry=await road(routePoints,mapApiKey.trim(),aborter.signal);
              aborter.signal.throwIfAborted();
              if(Number.isFinite(geometry.distance)) distanceOutput.textContent=(geometry.distance/1000).toLocaleString('pl-PL',{maximumFractionDigits:1})+' km';
              L.polyline(geometry,{pane:'mainRoute',color:'#1a73e8',weight:5,opacity:1,interactive:false,className:'main-route-line'}).addTo(map);
              const segment=geometry.reduce((longest,line)=>line.length>longest.length?line:longest,[]);
              const index=Math.max(1,Math.floor(segment.length/2));
              const from=map.project(segment[index-1],0),to=map.project(segment[index],0);
              const arrow=document.createElement('span');arrow.textContent='➤';
              arrow.style.display='block';arrow.style.transform='rotate('+Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI+'deg)';
              L.marker(map.unproject(from.add(to).divideBy(2),0),{interactive:false,icon:L.divIcon({className:'road-direction-arrow',html:arrow,iconSize:[24,24],iconAnchor:[12,12]})}).addTo(map);
            } catch(error) {if(aborter.signal.aborted) throw error;distanceOutput.textContent='Odległość niedostępna';roadFailures.push('A → B');}
          }
        }
        // Conservative sequential geocoding; HTTP cache handles map tiles independently.
        await new Promise(resolve=>setTimeout(resolve,300));
      }
      aborter.signal.throwIfAborted();
      if(current.route.some(text=>!coordinates.get(text))) distanceOutput.textContent='Odległość niedostępna';
      if(initialView) {
        if(viewport) map.setView(viewport.center,viewport.zoom,{animate:false});
        else if(bounds.length) focusArea('all');
        initialView=false;
      }
      status.textContent=[missing.length?'Niepotwierdzone lokalizacje (pominięto): '+missing.join('; '):'',roadFailures.length?'Brak przebiegu drogi: '+roadFailures.join('; '):''].filter(Boolean).join(' · ') || 'Punkty zlokalizowane. Przebieg drogowy dla samochodu, bez ograniczeń ciężarówki.';
        } catch(error) {
          if(controller===aborter) status.textContent=error.name==='AbortError'?'Przekroczono czas doładowania punktów. Otwórz mapę ponownie.':error.message;
        } finally {clearTimeout(batchTimeout);running=false;}
      }
      appendSuggestions = suggestions => {
        for(const record of suggestions) {
          const id=recordKey(record);
          if(!queued.has(id)) {queued.add(id);records.push(record);}
        }
        void pump();
      };
      await pump();
    } catch(error) {if(controller===aborter) status.textContent=error.name==='AbortError'?'Przekroczono czas. Zamknij i otwórz mapę ponownie.':error.message;}
    finally {clearTimeout(timer);}
  }
  trigger.addEventListener('click',()=>open().catch(()=>{status.textContent='Nie udało się otworzyć mapy.';}));
  document.getElementById('map-close').addEventListener('click',close);
  document.querySelectorAll('[data-map-area]').forEach(button=>button.addEventListener('click',()=>focusArea(button.dataset.mapArea)));
  return {update,open,close,highlight,resetDistance:()=>{distanceKey='';distanceController?.abort();clearTimeout(distanceTimer);distanceOutput.textContent='';}};
})();
