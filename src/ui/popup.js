'use strict';
const source = document.getElementById('source');
const status = document.getElementById('status');
const resultBox = document.getElementById('result');
const pointList = document.getElementById('points');
const openButton = document.getElementById('open');
const openWindowButton = document.getElementById('open-window');
const copyButton = document.getElementById('copy-points');
const selectionId = new URLSearchParams(location.search).get('selection');
const draftKey = selectionId ? 'draft-' + selectionId : 'draft';
let points = [], dirty = false, opening = false;
let copyController = null;
let hubRouteKey = '';
let hubStrategy = 'radius';
let strategySaving = false;
const strategySelect = document.getElementById('suggestion-strategy');
function paintStrategy() {
  for (const button of strategySelect.querySelectorAll('button')) {
    button.disabled = strategySaving || analyzing;
    button.setAttribute('aria-pressed', String(button.dataset.strategy === hubStrategy));
  }
}
const hubStates = new Map();
let enabledModules = normalizeRouteModules();
let analyzing = false, runId = 0, controller = null, warnings = [], ignored = [];
let localTimer = null, recognition = '', undoSnapshot = null;
const aiButton = document.getElementById('parse-ai');
const undoButton = document.getElementById('undo-ai');
const parseButton = document.getElementById('parse');
function setAnalyzing(value) {
  analyzing = value; parseButton.disabled = value;
  paintStrategy();
  aiButton.textContent = value ? 'AI analizuje…' : 'Rozpoznaj przez AI';
  aiButton.setAttribute('aria-busy', String(value));
  resultBox.setAttribute('aria-busy', String(value));
  resultBox.querySelectorAll('input, button').forEach(el => { el.disabled = value; });
  if (!value) renderPoints();
  updateOpen();
}
function cancelAnalysis() {
  clearTimeout(localTimer); localTimer = null;
  copyController?.abort();
  runId++; controller?.abort(); controller = null;
  if (analyzing) {
    setAnalyzing(false);
  }
}
async function refreshMode() {
  const settings = await readRouteSettings();
  enabledModules = settings.modules;
  hubStrategy = settings.strategy;
  paintStrategy();
  strategySelect.hidden = !enabledModules.hubSuggestions;
  aiButton.hidden = !enabledModules.aiExtraction;
  paintHubSuggestions();
  const label = document.getElementById('selected-model');
  label.textContent = aiProvider(settings.provider).name + ' · ' + settings.model + (settings.mode === 'ai' ? '' : ' · wyłączony');
  label.title = 'Model wybrany w ustawieniach';
  return settings;
}

strategySelect.addEventListener('click', async event => {
  const selected = event.target.closest('[data-strategy]');
  if (!selected) return;
  if (strategySaving) return;
  const strategy = selected.dataset.strategy;
  strategySaving = true; paintStrategy();
  for (const state of hubStates.values()) state.controller?.abort();
  hubStates.clear(); paintHubSuggestions();
  try {
    // Preserve all existing provider profiles, prompts and unknown settings.
    const {routeSettings = {}} = await chrome.storage.local.get('routeSettings');
    await chrome.storage.local.set({routeSettings: {...routeSettings, strategy}});
    await refreshMode();
  } catch {
    paintStrategy();
    message('Nie udało się zapisać trybu wyszukiwania. Spróbuj ponownie.', true);
  } finally {
    strategySaving = false; paintStrategy();
    paintHubSuggestions();
  }
});
function message(text, error = false) {
  status.textContent = text;
  status.classList.toggle('error', error);
}
function persist() {
  chrome.storage.session.set({[draftKey]: {text: source.value, points, dirty, warnings, ignored, recognition}}).catch(() => {
    message('Nie udało się zapamiętać szkicu. Możesz nadal otworzyć trasę.', true);
  });
}
// Short endpoint labels for the tab only; the actual route stays untouched.
const titleCountries = new Set();
for (const locale of ['pl','en','de','fr']) {
  const names = new Intl.DisplayNames([locale], {type:'region'});
  for (const code of 'PL DE CZ SK AT BE NL FR ES PT IT CH GB UK IE DK SE NO FI HU RO BG SI HR LT LV EE LU UA'.split(' ')) {
    titleCountries.add(code.toLowerCase());
    titleCountries.add(names.of(code === 'UK' ? 'GB' : code).toLowerCase());
  }
}
function titleEndpoint(value) {
  const original = value.trim().replace(/\s+/g,' ');
  let parts = original.split(',').map(part=>part.trim()).filter(Boolean);
  if (parts.length > 1 && titleCountries.has(parts.at(-1).toLowerCase())) parts.pop();
  let label = parts.join(', ').replace(/^[A-Z]{2}(?=[ ,\d])[, ]*/, '');
  label = label.replace(/^\d{2,5}(?:[- ]\d{2,4})?\s+/, '');
  return (label || original).slice(0,100);
}
function updateOpen() {
  document.title = points.length >= 2 && points[0].trim() && points.at(-1).trim() && !dirty
    ? titleEndpoint(points[0]) + ' > ' + titleEndpoint(points.at(-1))
    : 'Route Planner';
  document.body.classList.toggle('has-route', points.length > 0 || !!source.value.trim());
  document.querySelector('.maps-actions').hidden = resultBox.hidden;
  paintHubSuggestions();
  copyButton.disabled = !!copyController || analyzing || dirty || !points.length || points.some(p => !p.trim());
  aiButton.disabled = analyzing || !source.value.trim();
  undoButton.hidden = !undoSnapshot;
  undoButton.disabled = analyzing;
  document.getElementById('recognition').textContent = dirty ? 'Tekst zmieniony — oczekiwanie na rozpoznanie lokalne' : recognition;
  openButton.disabled = analyzing || dirty || opening || points.length < 2 || points.length > 11 || points.some(p => !p.trim());
  openWindowButton.disabled = openButton.disabled;
}
function suggestionCategory(label, strategy) {
  return strategy !== 'corridor' ? 'radius' : label.startsWith('TRASA') ? 'route' : label.startsWith('HUB') ? 'hub' : label === 'PODJAZD' ? 'approach' : 'exit';
}
function paintHubSuggestions() {
  const key = JSON.stringify(points);
  if (key !== hubRouteKey || dirty || analyzing) {
    for (const state of hubStates.values()) state.controller?.abort();
    hubStates.clear(); hubRouteKey = key;
  }
  SuggestionMap.update({route:[...points],strategy:hubStrategy,suggestionsEnabled:enabledModules.hubSuggestions,suggestions:[...hubStates.entries()].flatMap(([role,state])=>(state.items || []).filter(item=>!item.demo).map(item=>({role,label:item.label,text:item.country+' '+item.postcode+' '+item.city,item,category:suggestionCategory(item.label,state.strategy)})))}, enabledModules.suggestionMap && !dirty && !analyzing);
  for (const button of pointList.querySelectorAll('.hub-toggle')) {
    const state = hubStates.get(button.dataset.role);
    button.hidden = !enabledModules.hubSuggestions;
    button.disabled = strategySaving || analyzing || dirty || points.length < 2 || points.some(p => !p.trim());
    button.setAttribute('aria-busy', String(!!state?.controller));
    button.setAttribute('aria-expanded', String(!!state?.visible));
    const corridor = hubStrategy === 'corridor';
    button.innerHTML = corridor ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M8 3 4 21M16 3l4 18M12 4v3m0 4v3m0 4v2"/></svg>'  : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></svg>';
    button.setAttribute('aria-label', corridor ? 'Analizuj korytarz — sugestie dla A i B' : 'Sugeruj obszary przy punkcie ' + button.dataset.role);
    button.title = state?.controller ? 'Szukanie obszarów… Kliknij, aby anulować' : corridor ? 'Analizuj korytarz — sugestie dla A i B' : 'Sugestie obszarów poszukiwania przewoźników';
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    panel.hidden = !enabledModules.hubSuggestions || !state?.visible; panel.replaceChildren();
    if (!state?.visible) continue;
    if (state.controller || state.error || !state.items?.length) {
      const text = document.createElement('span'); text.className = 'hub-message';
      text.textContent = state.controller ? 'Szukanie obszarów…' : state.error || 'Brak potwierdzonych propozycji.';
      panel.append(text); continue;
    }
    if (state.items.some(item => item.demo)) {
      const badge=document.createElement('span');badge.className='hub-strategy';badge.textContent='DEMO — fikcyjne odległości';panel.append(badge);
    }
    for (const [index, item] of state.items.entries()) {
      const chip = document.createElement('div'); chip.className = 'hub-chip';
      const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'hub-chip-copy';
      chip.dataset.index = String(index);
      chip.dataset.category = suggestionCategory(item.label,state.strategy);
      const label = document.createElement('strong'); label.textContent = item.label.replace('HUB ', 'H');
      const address = document.createElement('span'); address.textContent = item.country + ' ' + item.postcode + ' ' + item.city;
      chip.title = item.reason;
      const distance = document.createElement('a'); distance.className = 'hub-distance hub-map-link';
      const kilometers = document.createElement('span'); kilometers.className = 'hub-kilometers'; kilometers.textContent = String(Math.round(item.roadKm));
      const arrow = document.createElement('span'); arrow.className = 'hub-map-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      distance.append(kilometers, arrow);
      const code = item.country + ' ' + item.postcode + ' ' + item.city;
      const mapRecord = {role:button.dataset.role,label:item.label,text:code};
      chip.addEventListener('mouseenter',()=>SuggestionMap.highlight(mapRecord));
      chip.addEventListener('mouseleave',()=>{if (!chip.contains(document.activeElement)) SuggestionMap.highlight(null);});
      chip.addEventListener('focusin',()=>SuggestionMap.highlight(mapRecord));
      chip.addEventListener('focusout',event=>{if (!chip.contains(event.relatedTarget)) SuggestionMap.highlight(null);});
      const anchor = button.dataset.role === 'A' ? points[0] : points.at(-1);
      distance.href = buildGoogleMapsUrl([anchor, code]);
      distance.target = '_blank'; distance.rel = 'noopener noreferrer';
      distance.title = 'Pokaż odcinek ' + anchor + ' → ' + code + ' w Google Maps';
      distance.setAttribute('aria-label', distance.title + ' (nowa karta; szacunek ' + Math.round(item.roadKm) + ' km)');
      copy.setAttribute('aria-label', 'Kopiuj ' + code);
      copy.addEventListener('click', async () => {
        copy.disabled = true;
        try {
          await navigator.clipboard.writeText(code);
          chip.classList.add('is-copied');
          setTimeout(() => { chip.classList.remove('is-copied'); copy.disabled = false; }, 1500);
          message('Skopiowano: ' + code);
        } catch { copy.disabled = false; message('Nie udało się skopiować. Spróbuj ponownie.', true); }
      });
      copy.append(label, address); chip.append(copy, distance); panel.append(chip);
    }
  }
}
async function toggleHubSuggestions(role) {
  if (strategySaving) return;
  if (hubStrategy !== 'corridor') return toggleEndpointSuggestions(role);
  if (!enabledModules.hubSuggestions || analyzing || dirty || points.length < 2 || points.some(p => !p.trim())) return;
  const states = ['A', 'B'].map(id => hubStates.get(id));
  if (states.some(state => state?.controller)) {
    for (const id of ['A', 'B']) { hubStates.get(id)?.controller?.abort(); hubStates.delete(id); }
    paintHubSuggestions(); return;
  }
  if (states.every(state => state?.items?.length)) {
    const visible = !states.every(state => state.visible);
    for (const state of states) state.visible = visible;
    paintHubSuggestions(); return;
  }
  // Retry both endpoints together; endpoint requests retain independent error states.
  hubStates.clear();
  await Promise.allSettled(['A', 'B'].map(id => toggleEndpointSuggestions(id)));
}
async function toggleEndpointSuggestions(role) {
  if (!enabledModules.hubSuggestions || analyzing || dirty || points.length < 2 || points.some(p => !p.trim())) return;
  const existing = hubStates.get(role);
  if (existing?.controller) {existing.controller.abort();hubStates.delete(role);paintHubSuggestions();return;}
  if (existing?.items?.length) {existing.visible = !existing.visible;paintHubSuggestions();return;}
  const snapshot = [...points], key = JSON.stringify(snapshot), controller = new AbortController();
  const state = {visible:true, controller, items:[]}; hubStates.set(role,state);paintHubSuggestions();
  const timer = setTimeout(()=>controller.abort(),90000);
  try {
    const settings = await readRouteSettings(); controller.signal.throwIfAborted();
    state.strategy = settings.strategy;
    const items = await findRouteHubs(snapshot,role,settings,controller.signal);
    if (controller.signal.aborted || hubStates.get(role) !== state || key !== JSON.stringify(points)) return;
    state.items = items;
  } catch(error) {
    if (hubStates.get(role) === state) state.error = controller.signal.aborted ? 'Przekroczono czas. Kliknij ikonę, aby spróbować ponownie.' : error.message;
  } finally {
    clearTimeout(timer);state.controller=null;
    if (hubStates.get(role) === state) paintHubSuggestions();
  }
}
let draggedIndex = null;
function insertPoint(index) {
  if (points.length >= 11) return;
  points.splice(index, 0, ''); renderPoints(); persist();
  document.getElementById('point-' + index).focus();
}
function movePoint(from, to) {
  if (from === to) return;
  points.splice(to, 0, points.splice(from, 1)[0]);
  renderPoints(); persist();
  pointList.querySelectorAll('.drag-handle')[to].focus();
  message('Przeniesiono punkt na pozycję ' + (to + 1) + '.');
}
function clearDrag() {
  draggedIndex = null;
  pointList.classList.remove('is-dragging');
  pointList.querySelectorAll('.dragging, .drop-target').forEach(el => el.classList.remove('dragging', 'drop-target'));
}
function markDrop(index) {
  pointList.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
  pointList.querySelector('[data-slot="' + index + '"]')?.classList.add('drop-target');
}
function dropPoint(event, slot) {
  if (draggedIndex === null) return;
  event.preventDefault();
  const from = draggedIndex, to = slot > from ? slot - 1 : slot;
  clearDrag(); movePoint(from, to);
}
function renderPoints() {
  clearDrag(); pointList.replaceChildren();
  function insertSlot(index) {
    const slot = document.createElement('li'); slot.className = 'insert-slot'; slot.dataset.slot = index;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'insert-point';
    button.setAttribute('aria-label', 'Dodaj punkt na pozycji ' + (index + 1));
    button.title = points.length >= 11 ? 'Maksymalnie 11 punktów' : 'Dodaj punkt w tym miejscu';
    button.disabled = points.length >= 11;
    const plus = document.createElement('span'); plus.className = 'plus-circle'; plus.textContent = '+'; plus.setAttribute('aria-hidden', 'true');
    button.append(plus); button.addEventListener('click', () => insertPoint(index));
    slot.append(button);
    slot.addEventListener('dragover', event => {
      if (draggedIndex === null) return;
      event.preventDefault(); event.dataTransfer.dropEffect = 'move'; markDrop(index);
    });
    slot.addEventListener('drop', event => dropPoint(event, index));
    pointList.append(slot);
  }
  points.forEach((value, index) => {
    insertSlot(index);
    const li = document.createElement('li'); li.className = 'point';
    const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'drag-handle'; handle.draggable = true;
    handle.setAttribute('aria-label', 'Przenieś punkt ' + (index + 1));
    handle.setAttribute('aria-describedby', 'reorder-help');
    handle.title = 'Przeciągnij, aby zmienić kolejność. Klawiatura: strzałki w górę / w dół.';
    const dots = document.createElement('span'); dots.className = 'grip-dots'; dots.setAttribute('aria-hidden', 'true'); handle.append(dots);
    handle.addEventListener('keydown', event => {
      const to = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : index;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault(); if (to >= 0 && to < points.length) movePoint(index, to);
    });
    handle.addEventListener('dragstart', event => {
      draggedIndex = index; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index));
      event.dataTransfer.setDragImage(li, 24, 22);
      li.classList.add('dragging'); pointList.classList.add('is-dragging');
    });
    handle.addEventListener('dragend', clearDrag);
    const slotAt = event => index + (event.clientY > li.getBoundingClientRect().top + li.offsetHeight / 2 ? 1 : 0);
    li.addEventListener('dragover', event => {
      if (draggedIndex === null) return;
      event.preventDefault(); event.dataTransfer.dropEffect = 'move'; markDrop(slotAt(event));
    });
    li.addEventListener('drop', event => dropPoint(event, slotAt(event)));
    const label = document.createElement('label'); label.className = 'point-label'; label.htmlFor = 'point-' + index;
    label.textContent = index === 0 ? 'A' : index === points.length - 1 ? 'B' : String(index);
    const input = document.createElement('input'); input.id = label.htmlFor; input.value = value; input.maxLength = 500;
    input.placeholder = 'Miasto, kod pocztowy lub adres'; input.setAttribute('aria-label', 'Adres punktu ' + label.textContent);
    input.addEventListener('input', () => { points[index] = input.value; updateOpen(); persist(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-point'; remove.textContent = '×';
    remove.title = 'Usuń punkt'; remove.setAttribute('aria-label', 'Usuń punkt ' + label.textContent);
    remove.addEventListener('click', () => {
      points.splice(index, 1); renderPoints(); persist();
      (document.getElementById('point-' + Math.min(index, points.length - 1)) || document.getElementById('add')).focus();
    });
    li.append(handle, label, input);
    if (index === 0 || index === points.length - 1) {
      li.classList.add('endpoint');
      const role = index === 0 ? 'A' : 'B';
      const suggest = document.createElement('button'); suggest.type = 'button'; suggest.className = 'hub-toggle'; suggest.dataset.role = role;
      suggest.setAttribute('aria-label', 'Sugeruj obszary przy punkcie ' + role);
      suggest.setAttribute('aria-controls', 'hub-panel-' + role);
      // Inline SVG is a fixed local icon, never model-provided markup.
      suggest.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></svg>';
      suggest.addEventListener('click',()=>toggleHubSuggestions(role));
      li.append(suggest,remove);
      const panel = document.createElement('div'); panel.id = 'hub-panel-' + role; panel.className = 'hub-suggestions'; panel.hidden = true;
      panel.setAttribute('role','region');panel.setAttribute('aria-label','Sugestie obszarów przy punkcie '+role);panel.setAttribute('aria-live','polite');
      li.append(panel);
    } else li.append(remove);
    pointList.append(li);
  });
  if (points.length) insertSlot(points.length);
  document.getElementById('add').disabled = points.length >= 11;
  updateOpen();
}
function showDetails(id, rows) {
  const box = document.getElementById(id + '-box');
  const list = document.getElementById(id);
  list.replaceChildren(); box.hidden = rows.length === 0;
  for (const text of rows) { const li = document.createElement('li'); li.textContent = text; list.append(li); }
  box.open = id === 'warnings' && rows.length > 0;
}
function displayResult(result, label) {
  points = result.points.map(p => p.query); dirty = false; recognition = label;
  warnings = result.warnings; ignored = result.ignoredFields.map(f => f.key + ': ' + f.value);
  resultBox.hidden = false;
  showDetails('warnings', warnings); showDetails('ignored', ignored);
  renderPoints();
  if (!source.value.trim()) message('Wklej tekst albo dodaj punkty ręcznie.');
  else if (points.length > 11) message('Wykryto więcej niż 11 punktów. Usuń zbędne punkty lub podziel trasę.', true);
  else if (points.length < 2) message('Rozpoznano ' + points.length + ' z minimum 2 punktów. Użyj „Rozpoznaj przez AI” lub dodaj adres ręcznie.', true);
  else message(result.needsReview ? 'Sprawdź uwagi do rozpoznania.' : '');
  persist();
}
function analyzeLocal() {
  cancelAnalysis(); undoSnapshot = null;
  try {
    if (source.value.length > 50000) throw new Error('Tekst jest zbyt długi. Wklej maksymalnie 50 000 znaków.');
    displayResult(parseTransportRoute(source.value), 'Rozpoznano lokalnie');
  } catch (error) {
    points = []; dirty = false; warnings = []; ignored = []; recognition = 'Nie udało się rozpoznać lokalnie';
    resultBox.hidden = false; showDetails('warnings', []); showDetails('ignored', []); renderPoints(); persist();
    message(error.message + ' Użyj „Rozpoznaj przez AI” lub dodaj punkty ręcznie.', true);
  }
}
async function analyzeAI() {
  if (!enabledModules.aiExtraction || analyzing || !source.value.trim()) return;
  clearTimeout(localTimer); localTimer = null;
  // Finish pending local recognition before taking a recoverable snapshot.
  if (dirty) analyzeLocal();
  const id = ++runId, text = source.value;
  const previous = {points: [...points], warnings: [...warnings], ignored: [...ignored], recognition, dirty};
  let timer;
  setAnalyzing(true);
  try {
    if (text.length > 50000) throw new Error('Tekst jest zbyt długi. Wklej maksymalnie 50 000 znaków.');
    const settings = await refreshMode();
    if (id !== runId) return;
    try {
      await RecognitionHistory.start(text, settings);
    } catch { message('Nie udało się zapisać przykładu; analiza AI będzie kontynuowana.', true); }
    if (id !== runId) return;
    if (settings.mode !== 'ai') throw new Error('W ustawieniach włącz „Lokalnie + AI na kliknięcie” i wybierz dostawcę oraz klucz API.');
    controller = new AbortController();
    const requestController = controller;
    timer = setTimeout(() => requestController.abort(), 45000);
    message(aiProvider(settings.provider).name + ' analizuje oryginalny tekst i wszystkie przystanki… Pozostaw to okno otwarte.');
    const result = await parseWithAI(text, settings, controller.signal, text => {
      if (id === runId) message(text);
    });
    if (id !== runId) return;
    undoSnapshot = previous;
    displayResult(result, 'Rozpoznano przez AI · ' + aiProvider(settings.provider).name);
  } catch (error) {
    if (id !== runId) return;
    message((error.name === 'AbortError' ? 'Przekroczono czas oczekiwania na usługę AI.' : error.message) + ' Dotychczasowe punkty pozostają dostępne.', true);
  } finally {
    clearTimeout(timer);
    if (id === runId) { controller = null; setAnalyzing(false); persist(); }
  }
}
parseButton.addEventListener('click', analyzeLocal);
aiButton.addEventListener('click', analyzeAI);
undoButton.addEventListener('click', () => {
  if (!undoSnapshot || analyzing) return;
  ({points, warnings, ignored, recognition, dirty} = undoSnapshot); undoSnapshot = null;
  showDetails('warnings', warnings); showDetails('ignored', ignored); renderPoints(); persist();
  message('Przywrócono punkty sprzed analizy AI.');
});
source.addEventListener('input', () => {
  cancelAnalysis(); undoSnapshot = null;
  dirty = true; updateOpen(); persist();
  message('Rozpoznawanie lokalne…');
  localTimer = setTimeout(analyzeLocal, 350);
});
source.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); analyzeAI(); }
});
document.getElementById('clear').addEventListener('click', async () => {
  cancelAnalysis(); warnings = []; ignored = []; recognition = ''; undoSnapshot = null;
  source.value = ''; points = []; dirty = false; resultBox.hidden = true;
  showDetails('warnings', []); showDetails('ignored', []); renderPoints(); message('');
  await chrome.storage.session.remove(draftKey); source.focus();
});
document.getElementById('add').addEventListener('click', () => insertPoint(points.length));
async function openRoute(target) {
  if (target === 'window' ? openWindowButton.disabled : openButton.disabled) return;
  opening = true; updateOpen();
  try {
    const url = buildGoogleMapsUrl(points.map(p => p.trim()));
    if (target === 'window') {
      await chrome.windows.create({url, type: 'normal', focused: true});
    } else {
      const tab = await chrome.tabs.getCurrent();
      if (tab?.id !== undefined) {
        await chrome.tabs.update(tab.id, {url});
      } else {
        const [activeTab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (activeTab?.id === undefined) throw new Error('Nie znaleziono bieżącej karty.');
        await chrome.tabs.update(activeTab.id, {url});
        window.close();
      }
    }
  } catch (error) { message('Nie udało się otworzyć trasy: ' + error.message, true); }
  finally { opening = false; updateOpen(); }
}
openButton.addEventListener('click', () => openRoute('tab'));
openWindowButton.addEventListener('click', () => openRoute('window'));
copyButton.addEventListener('click', async () => {
  if (copyButton.disabled) return;
  const snapshot = [...points], sourceSnapshot = source.value, copyRun = runId;
  const aborter = new AbortController(); copyController = aborter;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; aborter.abort(); }, 60000);
  const unchanged = () => copyRun === runId && !dirty && source.value === sourceSnapshot && JSON.stringify(points) === JSON.stringify(snapshot);
  copyButton.setAttribute('aria-busy', 'true');
  copyButton.setAttribute('aria-label', 'Sprawdzanie kodów i kopiowanie…');
  copyButton.title = 'Sprawdzanie kodów i kopiowanie…';
  updateOpen();
  let output = snapshot, note = '', enriched = 0;
  message('Sprawdzanie kodów pocztowych w Groq…');
  try {
    try {
      const settings = await readRouteSettings();
      if (!settings.modules.postalLookup) {
        note = '';
      } else if (settings.provider === 'offline') {
        note = 'Kopiowanie offline — bez sprawdzania kodów.';
      } else if (settings.mode !== 'ai') {
        note = 'Bez uzupełnienia kodów — włączono tryb lokalny.';
      } else if (!settings.profiles.groq.apiKey.trim()) {
        note = 'Bez uzupełnienia kodów — brak zapisanego klucza Groq.';
      } else {
        aborter.signal.throwIfAborted();
        const cases = snapshot.map((input, index) => ({id: String(index), input}));
        const rows = await runPostalTest(settings.profiles.groq.apiKey, aborter.signal, cases);
        const result = TransportMaps.enrichClipboardPoints(snapshot, rows);
        output = result.points; enriched = result.enriched;
        if (!enriched) note = 'Bez uzupełnienia — brak jednoznacznych nowych kodów.';
      }
    } catch {
      note = timedOut ? 'Bez uzupełnienia kodów — przekroczono czas wyszukiwania.' : 'Bez uzupełnienia kodów — wyszukiwanie nie powiodło się.';
    }
    if (!unchanged() || (aborter.signal.aborted && !timedOut)) {
      if (source.value === sourceSnapshot && !analyzing) message('Trasa się zmieniła. Kliknij kopiowanie ponownie.');
      return;
    }
    await navigator.clipboard.writeText(TransportMaps.formatClipboardRoute(output));
    message('Skopiowano punkty trasy.' + (enriched ? ' Uzupełniono kodów: ' + enriched + '.' : '') + (note ? ' ' + note : ''));
  } catch {
    message('Nie udało się zapisać do schowka. Kliknij kopiowanie ponownie.', true);
  } finally {
    clearTimeout(timer); copyController = null;
    copyButton.setAttribute('aria-busy', 'false');
    copyButton.setAttribute('aria-label', 'Sprawdź kody w Groq i kopiuj punkty');
    copyButton.title = 'Sprawdź kody w Groq i kopiuj punkty';
    updateOpen();
  }
});
async function initialize() {
  try {
    await refreshMode().catch(() => message('Nie udało się odczytać ustawień AI. Rozpoznanie lokalne jest dostępne.', true));
    const mapId = new URLSearchParams(location.search).get('mapSnapshot');
    if (mapId) {
      const key='map-snapshot-'+mapId;
      const snapshot=(await chrome.storage.session.get(key))[key];
      if (snapshot?.route?.length) {
        points=snapshot.route;source.value=points.join(' → ');dirty=false;resultBox.hidden=false;renderPoints();
        for (const role of ['A','B']) hubStates.set(role,{visible:true,strategy:hubStrategy,items:snapshot.suggestions.filter(s=>s.role===role && s.item).map(s=>s.item)});
        paintHubSuggestions();
        SuggestionMap.update(snapshot,enabledModules.suggestionMap);
        if (enabledModules.suggestionMap) await SuggestionMap.open();
        return;
      }
    }
    if (selectionId) {
      const key = 'selection-' + selectionId;
      const stored = await chrome.storage.session.get(key);
      if (stored[key]?.text) {
        source.value = stored[key].text;
        await chrome.storage.session.remove(key);
        const imported=stored[key];
        if(imported.source==='timocom'&&Array.isArray(imported.points)&&imported.points.length>=2&&imported.points.length<=11&&imported.points.every(p=>typeof p==='string'&&p.length<=300&&/^[A-Z]{2} \S/.test(p))) {
          points=[...imported.points];dirty=false;recognition='Pobrano z TimoCom';resultBox.hidden=false;
          renderPoints();persist();return;
        }
        analyzeLocal(); return;
      }
    }
    const saved = (await chrome.storage.session.get(draftKey))[draftKey];
    if (saved) {
      source.value = saved.text || '';
      warnings = Array.isArray(saved.warnings) ? saved.warnings : [];
      ignored = Array.isArray(saved.ignored) ? saved.ignored : [];
      showDetails('warnings', warnings); showDetails('ignored', ignored);
      if (Array.isArray(saved.points)) points = saved.points.filter(p => typeof p === 'string');
      recognition = typeof saved.recognition === 'string' ? saved.recognition : 'Przywrócono zapisane punkty';
      dirty = !!saved.dirty; resultBox.hidden = !points.length && !source.value;
      renderPoints(); persist();
      if (dirty) analyzeLocal();
    }
  } catch (error) { message('Nie udało się odczytać szkicu. Możesz wkleić tekst ręcznie.', true); }
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.mapApiKey) { SuggestionMap.close(); SuggestionMap.resetDistance(); paintHubSuggestions(); }
  if (area === 'local' && changes.routeSettings) {
    cancelAnalysis();
    for (const state of hubStates.values()) state.controller?.abort();
    hubStates.clear(); paintHubSuggestions();
    if (dirty) analyzeLocal();
    refreshMode().catch(() => message('Nie udało się odczytać ustawień.', true));
  }
});
updateOpen();
initialize();
