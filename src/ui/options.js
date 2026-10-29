'use strict';
const hubModelInput = document.getElementById('hub-model');
const hubStrategyInput = document.getElementById('hub-strategy');
function updateHubPrompt() { document.getElementById('hub-prompt').value = getHubPrompt(hubStrategyInput.value); }
hubStrategyInput.addEventListener('change', updateHubPrompt);
updateHubPrompt();
const form = document.getElementById('settings-form');
const moduleInputs = new Map();
for (const [id, module] of Object.entries(ROUTE_MODULES)) {
  const label = document.createElement('label'); label.className = 'mode-option';
  const input = document.createElement('input'); input.type = 'checkbox'; input.id = 'module-' + id; input.checked = module.defaultEnabled;
  const text = document.createElement('span'); text.textContent = module.label;
  label.append(input, text); document.getElementById('module-settings').append(label); moduleInputs.set(id, input);
  input.addEventListener('change', () => { resetConnection(); showMode(); });
}
function currentModules() {return Object.fromEntries([...moduleInputs].map(([id, input]) => [id, input.checked]));}

const promptInput = document.getElementById('prompt-preview');
const promptStatus = document.getElementById('prompt-status');
const resetPromptButton = document.getElementById('reset-prompt');
promptInput.value = AI_ROUTE_PROMPT;
document.getElementById('schema-preview').textContent = JSON.stringify(AI_ROUTE_SCHEMA, null, 2);
const keyInput = document.getElementById('api-key');
const modelInput = document.getElementById('model');
const customModelInput = document.getElementById('custom-model');
const providerInput = document.getElementById('provider');
const settingsStatus = document.getElementById('settings-status');
const testButton = document.getElementById('test-connection');
const saveButton = document.getElementById('save-settings');
const deleteButton = document.getElementById('delete-key');
const connectionStatus = document.getElementById('connection-status');
let connectionRun = 0, connectionController = null, loaded = false;
let profiles = {}, savedProfiles = {}, selectedProvider = 'gemini';
for (const [id, provider] of Object.entries(AI_PROVIDERS)) providerInput.add(new Option(provider.name, id));
function currentModel() { return (modelInput.value === 'custom' ? customModelInput.value : modelInput.value).trim(); }
function captureProfile() {
  if (loaded && selectedProvider && profiles[selectedProvider]) {
    profiles[selectedProvider] = {model: currentModel(), apiKey: keyInput.value.trim()};
  }
}
function maskApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) {
    return trimmed.slice(0, 2) + '••••' + trimmed.slice(-2);
  }
  const prefixLen = trimmed.length >= 12 ? 6 : 4;
  const suffixLen = 4;
  return trimmed.slice(0, prefixLen) + '••••••••' + trimmed.slice(-suffixLen);
}
function updateSavedKeyPreview() {
  const preview = document.getElementById('saved-key-preview');
  if (!preview) return;
  const provider = aiProvider(selectedProvider);
  const savedKey = savedProfiles?.[selectedProvider]?.apiKey?.trim();
  const currentKey = keyInput.value.trim();

  if (savedKey) {
    const masked = maskApiKey(savedKey);
    if (currentKey && currentKey !== savedKey) {
      preview.textContent = 'Zapisany klucz: ' + masked + ' (w polu wpisano nowy klucz — kliknij „Zapisz ustawienia”)';
      preview.dataset.state = 'pending';
    } else {
      preview.textContent = 'Zapisany klucz: ' + masked;
      preview.dataset.state = 'saved';
    }
  } else if (currentKey) {
    preview.textContent = 'Nowy klucz: ' + maskApiKey(currentKey) + ' (niezapisany — kliknij „Zapisz ustawienia”)';
    preview.dataset.state = 'pending';
  } else {
    preview.textContent = 'Brak zapisanego klucza dla: ' + provider.name;
    preview.dataset.state = 'empty';
  }
}
function currentSettings() {
  captureProfile();
  const selectedHubOption = hubModelInput.selectedOptions[0];
  const hubProvider = selectedHubOption?.dataset?.provider || (typeof inferHubProvider === 'function' ? inferHubProvider(hubModelInput.value) : 'groq');
  return {mode: form.elements.mode.value, provider: selectedProvider, profiles, modules: currentModules(), hubModel: hubModelInput.value, hubProvider, strategy: hubStrategyInput.value, customPrompt: promptInput.value === AI_ROUTE_PROMPT ? null : promptInput.value, ...profiles[selectedProvider]};
}
function updateHubModels() {
  const currentVal = hubModelInput.value;
  const withKeys = Object.entries(AI_PROVIDERS).filter(([id]) => !!profiles[id]?.apiKey?.trim());
  const providersToShow = withKeys.length > 0 ? [...withKeys.filter(([id]) => id !== 'offline'), ['offline', AI_PROVIDERS.offline]] : Object.entries(AI_PROVIDERS);
  hubModelInput.replaceChildren();
  let foundCurrent = false;

  for (const [providerId, provider] of providersToShow) {
    const group = document.createElement('optgroup');
    group.label = provider.name;
    for (const [modelId, label] of provider.models) {
      const option = new Option(label, modelId);
      option.dataset.provider = providerId;
      if (modelId === currentVal) foundCurrent = true;
      group.append(option);
    }
    const prof = profiles[providerId];
    if (prof?.model && prof.model !== 'custom' && !provider.models.some(([id]) => id === prof.model)) {
      const option = new Option(prof.model + ' (własny)', prof.model);
      option.dataset.provider = providerId;
      if (prof.model === currentVal) foundCurrent = true;
      group.append(option);
    }
    hubModelInput.append(group);
  }

  if (currentVal && !foundCurrent) {
    const fallbackGroup = document.createElement('optgroup');
    fallbackGroup.label = 'Bieżący model';
    const opt = new Option(currentVal, currentVal);
    opt.dataset.provider = typeof inferHubProvider === 'function' ? inferHubProvider(currentVal) : 'groq';
    fallbackGroup.append(opt);
    hubModelInput.prepend(fallbackGroup);
    hubModelInput.value = currentVal;
  } else if (currentVal) {
    hubModelInput.value = currentVal;
  }
}
function showProvider() {
  const provider = aiProvider(selectedProvider), profile = profiles[selectedProvider];
  modelInput.replaceChildren();
  for (const [id, label] of provider.models) modelInput.add(new Option(label, id));
  if (selectedProvider !== 'offline') modelInput.add(new Option('Inny model…', 'custom'));
  modelInput.value = provider.models.some(([id]) => id === profile.model) ? profile.model : 'custom';
  customModelInput.value = profile.model;
  keyInput.value = profile.apiKey;
  document.getElementById('provider-note').textContent = provider.note;
  document.getElementById('provider-privacy').textContent = provider.privacy;
  document.getElementById('api-key-label').textContent = 'Klucz API — ' + provider.name;
  const link = document.getElementById('get-api-key'); link.href = provider.keyUrl || '#';
  link.textContent = 'Utwórz klucz — ' + provider.name + ' ↗';
  updateSavedKeyPreview();
  showMode();
}
function showMode() {
  const ai = form.elements.mode.value === 'ai', custom = modelInput.value === 'custom';
  const modules = currentModules();
  document.getElementById('ai-settings').hidden = !ai;
  document.getElementById('custom-model-box').hidden = !custom;
  for (const [id, input] of moduleInputs) {
    const isEnabled = input.checked;
    const elements = document.querySelectorAll(`[data-module="${id}"], #module-options-${id}`);
    for (const el of elements) {
      const requiresAi = el.dataset.requiresAi === 'true' || el.closest('#ai-settings') !== null;
      el.hidden = !isEnabled || (requiresAi && !ai);
      for (const control of el.querySelectorAll('input, select, textarea, button')) {
        control.disabled = !loaded || el.hidden;
      }
    }
  }
  for (const input of [providerInput, modelInput, keyInput]) input.disabled = !loaded || !ai;
  customModelInput.disabled = !loaded || !ai || !custom;
  customModelInput.required = ai && custom;
  const offline = selectedProvider === 'offline';
  keyInput.required = ai && !offline;
  keyInput.disabled = !loaded || !ai || offline;
  for (const id of ['api-key-label', 'api-key', 'saved-key-preview', 'get-api-key']) document.getElementById(id).hidden = offline;
  for (const input of moduleInputs.values()) input.disabled = !loaded;
  hubModelInput.disabled = !loaded || !ai || !modules.hubSuggestions;
  promptInput.disabled = !loaded || !ai || !modules.aiExtraction;
  resetPromptButton.disabled = !loaded || !ai || !modules.aiExtraction;
  testButton.disabled = !loaded || !ai || !modules.aiExtraction || !!connectionController;
  deleteButton.disabled = !loaded || !ai || offline;
}
function connectionMessage(text, state = '') {
  connectionStatus.textContent = text; connectionStatus.dataset.state = state;
}
function resetConnection() {
  connectionRun++; connectionController?.abort(); connectionController = null;
  testButton.textContent = 'Sprawdź połączenie'; testButton.setAttribute('aria-busy', 'false');
  connectionMessage(''); showMode();
}
providerInput.addEventListener('change', () => {
  captureProfile();
  selectedProvider = providerInput.value;
  showProvider();
  resetConnection();
  updateHubModels();
});
promptInput.addEventListener('input', () => {
  resetConnection();
  promptStatus.textContent = 'Niezapisane zmiany — kliknij „Zapisz ustawienia”.';
});
resetPromptButton.addEventListener('click', () => {
  promptInput.value = AI_ROUTE_PROMPT; resetConnection();
  promptStatus.textContent = 'Przywrócono instrukcję domyślną. Kliknij „Zapisz ustawienia”, aby ją zapamiętać.';
});
keyInput.addEventListener('input', () => {
  captureProfile(); updateSavedKeyPreview(); updateHubModels(); resetConnection();
});
customModelInput.addEventListener('input', () => {
  captureProfile(); resetConnection();
});
modelInput.addEventListener('change', () => {
  captureProfile(); showMode(); resetConnection();
});
form.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', resetConnection));
function validatePrompt() {
  if (!promptInput.value.trim()) throw new Error('Instrukcja AI nie może być pusta. Wpisz własną lub przywróć domyślną.');
  if (promptInput.value.length > 20000) throw new Error('Instrukcja AI może mieć maksymalnie 20 000 znaków.');
}
function validateSettings(settings) {
  if (settings.modules?.aiExtraction !== false) validatePrompt();
  if (settings.provider !== 'offline' && !settings.apiKey) throw new Error('Wpisz klucz API dostawcy ' + aiProvider(settings.provider).name + '.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(settings.model)) throw new Error('Wpisz poprawny identyfikator modelu.');
}
testButton.addEventListener('click', async () => {
  if (!loaded || connectionController || !currentModules().aiExtraction) return;
  const settings = currentSettings();
  try { validateSettings(settings); } catch (error) { connectionMessage(error.message, 'error'); return; }
  const id = ++connectionRun, controller = new AbortController(); connectionController = controller;
  testButton.disabled = true; testButton.textContent = 'Sprawdzanie…'; testButton.setAttribute('aria-busy', 'true');
  connectionMessage(settings.provider === 'offline' ? 'Sprawdzanie przykładowej odpowiedzi offline…' : 'Łączenie z ' + aiProvider(settings.provider).name + ' i sprawdzanie odpowiedzi modelu…', 'pending');
  const started = performance.now(), timer = setTimeout(() => controller.abort(), 45000);
  try {
    const result = await parseWithAI('loading: PL, 00-001, Warszawa\nunloading: DE, 10115, Berlin', settings, controller.signal, text => {
      if (id === connectionRun) connectionMessage(text, 'pending');
    });
    if (id !== connectionRun) return;
    if (result.points.length !== 2) throw new Error('Model odpowiedział, ale nie rozpoznał dwóch punktów przykładowej trasy. Spróbuj ponownie lub zmień model.');
    const elapsed = ((performance.now() - started) / 1000).toLocaleString('pl-PL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    const checkedAt = new Date().toLocaleTimeString('pl-PL');
    connectionMessage((settings.provider === 'offline' ? '✓ Test offline działa — bez połączenia z API. ' : '✓ Połączenie działa. ') + aiProvider(settings.provider).name + ' · ' + settings.model + ': poprawny format odpowiedzi z 2 punktami. Czas: ' + elapsed + ' s. Sprawdzono o ' + checkedAt + '. Zapisz ustawienia, jeśli je zmieniono.', 'success');
  } catch (error) {
    if (id === connectionRun) connectionMessage(error.name === 'AbortError' ? 'Przekroczono czas oczekiwania (45 s). Spróbuj ponownie lub wybierz innego dostawcę.' : error.message, 'error');
  } finally {
    clearTimeout(timer);
    if (id === connectionRun) {
      connectionController = null; testButton.textContent = 'Sprawdź połączenie'; testButton.setAttribute('aria-busy', 'false'); showMode();
    }
  }
});
form.addEventListener('submit', async event => {
  event.preventDefault(); if (!loaded) return;
  captureProfile();
  const settings = currentSettings();
  try {
    if (settings.modules.aiExtraction) validatePrompt();
    if (settings.mode === 'ai') validateSettings(settings);
    saveButton.disabled = true;
    await chrome.storage.local.set({routeSettings: {mode: settings.mode, provider: settings.provider, profiles: settings.profiles, customPrompt: settings.customPrompt, hubModel: settings.hubModel, hubProvider: settings.hubProvider, strategy: settings.strategy, modules: settings.modules}});
    savedProfiles = JSON.parse(JSON.stringify(settings.profiles));
    promptStatus.textContent = settings.customPrompt === null ? 'Zapisano instrukcję domyślną.' : 'Zapisano Twoją instrukcję — będzie używana przy każdej analizie AI.';
    updateSavedKeyPreview();
    updateHubModels();
    showMode();
    settingsStatus.textContent = 'Ustawienia zapisane. Będą użyte przy następnym rozpoznaniu trasy.';
  } catch (error) { settingsStatus.textContent = 'Nie udało się zapisać ustawień. ' + error.message; }
  finally { saveButton.disabled = false; }
});
deleteButton.addEventListener('click', async () => {
  resetConnection();
  const deletingProvider = selectedProvider;
  try {
    const saved = await readRouteSettings();
    saved.profiles[deletingProvider].apiKey = '';
    const mode = saved.provider === deletingProvider ? 'local' : saved.mode;
    await chrome.storage.local.set({routeSettings: {mode, provider: saved.provider, profiles: saved.profiles, customPrompt: saved.customPrompt, hubModel: saved.hubModel, hubProvider: saved.hubProvider, strategy: saved.strategy, modules: saved.modules}});
    profiles[deletingProvider].apiKey = '';
    savedProfiles[deletingProvider].apiKey = '';
    if (selectedProvider === deletingProvider) { keyInput.value = ''; form.elements.mode.value = 'local'; }
    updateSavedKeyPreview();
    updateHubModels();
    showMode();
    settingsStatus.textContent = 'Usunięto klucz: ' + aiProvider(deletingProvider).name + '. Pozostałe klucze zachowano.';
  } catch { settingsStatus.textContent = 'Nie udało się usunąć klucza.'; }
});
(async () => {
  saveButton.disabled = true; showMode();
  try {
    const settings = await readRouteSettings();
    for (const [id, input] of moduleInputs) input.checked = settings.modules[id];
    hubModelInput.value = settings.hubModel;
    hubStrategyInput.value = settings.strategy; updateHubPrompt();
    promptInput.value = getAiRoutePrompt(settings);
    promptStatus.textContent = settings.customPrompt === null ? 'Używana jest instrukcja domyślna.' : 'Używana jest Twoja zapisana instrukcja.';
    profiles = settings.profiles;
    savedProfiles = JSON.parse(JSON.stringify(settings.profiles));
    selectedProvider = settings.provider;
    providerInput.value = selectedProvider; form.elements.mode.value = settings.mode;
    loaded = true; showProvider(); updateHubModels(); saveButton.disabled = false;
  } catch { settingsStatus.textContent = 'Nie udało się odczytać ustawień. Otwórz tę stronę ponownie.'; }
})();

chrome.storage.local.get('mapApiKey').then(saved=>{document.getElementById('map-api-key').value=saved.mapApiKey || '';}).catch(()=>{});
document.getElementById('save-map-key').addEventListener('click',async()=>{
  const status=document.getElementById('map-key-status');
  try {await chrome.storage.local.set({mapApiKey:document.getElementById('map-api-key').value.trim()});status.textContent='Zapisano klucz mapy.';} catch {status.textContent='Nie udało się zapisać klucza.';}
});
