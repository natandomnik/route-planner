'use strict';
(() => {
  const mapSelector='[class*="LoadingPlacesMapImage_mapContainer__"]';
  const countrySelector='[data-testid^="LoadingPlacesView/loadingPlaceCountry_"]';
  const hosts=new Map();
  let observer=null,timer=null,enabled=false;
  const clean=value=>String(value||'').replace(/\s+/g,' ').replace(/^[,\s]+/,'').trim();
  function routeFor(map) {
    // Stop at the nearest complete offer; never combine addresses from adjacent offers.
    for(let scope=map.parentElement;scope&&scope!==document.body;scope=scope.parentElement) {
      if(scope.querySelectorAll(mapSelector).length!==1) return null;
      const countries=[...scope.querySelectorAll(countrySelector)];
      if(countries.length<2) continue;
      const indexed=countries.map(el=>({el,index:Number(el.dataset.testid.split('_').at(-1))})).sort((a,b)=>a.index-b.index);
      if(indexed.length>11||new Set(indexed.map(p=>p.index)).size!==indexed.length) return null;
      const points=indexed.map(({el,index})=>{
        const city=scope.querySelector(`[data-testid="LoadingPlacesView/loadingPlaceCity_${index}"]`);
        const country=clean(el.textContent).toUpperCase(),address=clean(city?.textContent);
        return /^[A-Z]{2}$/.test(country)&&address&&address.length<=280?country+' '+address:null;
      });
      return points.every(Boolean)?points:null;
    }
    return null;
  }
  function createActions(map) {
    const host=document.createElement('div');host.className='route-planner-timocom-actions';
    const shadow=host.attachShadow({mode:'open'});
    const style=document.createElement('style');style.textContent=`
      :host { display:block; margin-top:10px; }
      .actions { display:flex; flex-direction:row; flex-wrap:wrap; align-items:center; gap:8px; }
      button {
        box-sizing:border-box;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        flex:0 0 auto;
        white-space:nowrap;
        height:var(--height-form-elements, 36px);
        padding:0 var(--padding, 16px);
        font-family:inherit;
        font-size:14px;
        font-weight:700;
        text-align:center;
        color:#486478;
        background-color:#fff;
        border:1px solid #7ba1bc;
        border-radius:3px;
        transition:none;
        overflow:hidden;
        box-shadow:none;
        cursor:pointer;
      }
      button:first-child { color:#fff; background-color:#4d99dd; border-color:#1a79c4; }
      button:hover:not(:disabled) { color:#365366; background-color:#edf4f8; border-color:#486478; }
      button:first-child:hover:not(:disabled) { color:#fff; background-color:#1a79c4; border-color:#1467ab; }
      .external-arrow { font-size:16px; line-height:1; }
      button:focus-visible { outline:2px solid #1a79c4; outline-offset:2px; }
      button:disabled { opacity:.55; cursor:wait; }
      .status { font:12px/1.4 system-ui; color:#a12d2d; margin-top:4px; }
    `;
    const actions=document.createElement('div');actions.className='actions';
    const status=document.createElement('div');status.className='status';status.setAttribute('role','status');
    for(const [target,label] of [['planner','Road Planner'],['google','Google Maps']]) {
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.title=label+' — otwórz w nowej karcie';
      const arrow=document.createElement('span');arrow.className='external-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');button.append(arrow);
      button.addEventListener('click',async event=>{
        event.stopPropagation();const points=routeFor(map);
        if(!enabled||!points) {status.textContent='Nie można odczytać punktów tej oferty.';return;}
        button.disabled=true;status.textContent='';
        try {
          const result=await chrome.runtime.sendMessage({type:'route-planner/timocom-open',target,points});
          if(!result?.ok) throw new Error();
        } catch {status.textContent='Nie udało się otworzyć trasy. Odśwież stronę po przeładowaniu rozszerzenia.';}
        finally {button.disabled=false;}
      });actions.append(button);
    }
    shadow.append(style,actions,status);map.after(host);hosts.set(map,host);
  }
  function scan() {
    if(!enabled) return;
    for(const [map,host] of hosts) if(!map.isConnected||!host.isConnected||!routeFor(map)) {host.remove();hosts.delete(map);}
    for(const map of document.querySelectorAll(mapSelector)) if(!hosts.has(map)&&routeFor(map)) createActions(map);
  }
  function configure(settings) {
    enabled=settings?.modules?.timocom!==false;
    observer?.disconnect();clearTimeout(timer);
    if(!enabled) {for(const host of hosts.values()) host.remove();hosts.clear();return;}
    scan();observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,150);});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-testid','class']});
  }
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.routeSettings) configure(changes.routeSettings.newValue);});
  chrome.storage.local.get('routeSettings').then(saved=>configure(saved.routeSettings)).catch(()=>{});
})();
