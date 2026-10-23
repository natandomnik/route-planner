'use strict';
const hubModelInput = document.getElementById('hub-model');
document.getElementById('hub-prompt').value = HUB_PROMPT;
const form = document.getElementById('settings-form');
const moduleInputs = new Map();
for (const [id, module] of Object.entries(ROUTE_MODULES)) {
  const label = document.createElement('label'); label.className = 'mode-option';
  const input = document.createElement('input'); input.type = 'checkbox'; input.id = 'module-' + id; input.checked = module.defaultEnabled;
  const text = document.createElement('span'); text.textContent = module.label;
  label.append(input, text); document.getElementById('module-settings').append(label); moduleInputs.set(id, input);
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
let profiles = {}, selectedProvider = 'gemini';
for (const [id, provider] of Object.entries(AI_PROVIDERS)) providerInput.add(new Option(provider.name, id));
function currentModel() { return (modelInput.value === 'custom' ? customModelInput.value : modelInput.value).trim(); }
function captureProfile() {
  if (loaded) profiles[selectedProvider] = {model: currentModel(), apiKey: keyInput.value.trim()};
}
function currentSettings() {
  captureProfile();
  return {mode: form.elements.mode.value, provider: selectedProvider, profiles, modules: currentModules(), hubModel: hubModelInput.value, customPrompt: promptInput.value === AI_ROUTE_PROMPT ? null : promptInput.value, ...profiles[selectedProvider]};
}
function showProvider() {
  const provider = aiProvider(selectedProvider), profile = profiles[selectedProvider];
  modelInput.replaceChildren();
  for (const [id, label] of provider.models) modelInput.add(new Option(label, id));
  modelInput.add(new Option('Inny model…', 'custom'));
  modelInput.value = provider.models.some(([id]) => id === profile.model) ? profile.model : 'custom';
  customModelInput.value = profile.model;
  keyInput.value = profile.apiKey;
  document.getElementById('provider-note').textContent = provider.note;
  document.getElementById('provider-privacy').textContent = provider.privacy;
  document.getElementById('api-key-label').textContent = 'Klucz API — ' + provider.name;
  const link = document.getElementById('get-api-key'); link.href = provider.keyUrl;
  link.textContent = 'Utwórz klucz — ' + provider.name + ' ↗';
  showMode();
}
function showMode() {
  const ai = form.elements.mode.value === 'ai', custom = modelInput.value === 'custom';
  document.getElementById('ai-settings').hidden = !ai;
  document.getElementById('custom-model-box').hidden = !custom;
  for (const input of [providerInput, modelInput, keyInput]) input.disabled = !loaded || !ai;
  customModelInput.disabled = !loaded || !ai || !custom;
  customModelInput.required = ai && custom;
  keyInput.required = ai;
  for (const input of moduleInputs.values()) input.disabled = !loaded;
  hubModelInput.disabled = !loaded || !ai;
  promptInput.disabled = !loaded; resetPromptButton.disabled = !loaded;
  testButton.disabled = !loaded || !ai || !!connectionController;
  deleteButton.disabled = !loaded || !ai;
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
  captureProfile(); selectedProvider = providerInput.value; resetConnection(); showProvider();
});
promptInput.addEventListener('input', () => {
  resetConnection();
  promptStatus.textContent = 'Niezapisane zmiany — kliknij „Zapisz ustawienia”.';
});
resetPromptButton.addEventListener('click', () => {
  promptInput.value = AI_ROUTE_PROMPT; resetConnection();
  promptStatus.textContent = 'Przywrócono instrukcję domyślną. Kliknij „Zapisz ustawienia”, aby ją zapamiętać.';
});
keyInput.addEventListener('input', resetConnection);
customModelInput.addEventListener('input', resetConnection);
modelInput.addEventListener('change', resetConnection);
form.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', resetConnection));
function validatePrompt() {
  if (!promptInput.value.trim()) throw new Error('Instrukcja AI nie może być pusta. Wpisz własną lub przywróć domyślną.');
  if (promptInput.value.length > 20000) throw new Error('Instrukcja AI może mieć maksymalnie 20 000 znaków.');
}
function validateSettings(settings) {
  validatePrompt();
  if (!settings.apiKey) throw new Error('Wpisz klucz API dostawcy ' + aiProvider(settings.provider).name + '.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(settings.model)) throw new Error('Wpisz poprawny identyfikator modelu.');
}
testButton.addEventListener('click', async () => {
  if (!loaded || connectionController) return;
  const settings = currentSettings();
  try { validateSettings(settings); } catch (error) { connectionMessage(error.message, 'error'); return; }
  const id = ++connectionRun, controller = new AbortController(); connectionController = controller;
  testButton.disabled = true; testButton.textContent = 'Sprawdzanie…'; testButton.setAttribute('aria-busy', 'true');
  connectionMessage('Łączenie z ' + aiProvider(settings.provider).name + ' i sprawdzanie odpowiedzi modelu…', 'pending');
  const started = performance.now(), timer = setTimeout(() => controller.abort(), 45000);
  try {
    const result = await parseWithAI('loading: PL, 00-001, Warszawa\nunloading: DE, 10115, Berlin', settings, controller.signal, text => {
      if (id === connectionRun) connectionMessage(text, 'pending');
    });
    if (id !== connectionRun) return;
    if (result.points.length !== 2) throw new Error('Model odpowiedział, ale nie rozpoznał dwóch punktów przykładowej trasy. Spróbuj ponownie lub zmień model.');
    const elapsed = ((performance.now() - started) / 1000).toLocaleString('pl-PL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    const checkedAt = new Date().toLocaleTimeString('pl-PL');
    connectionMessage('✓ Połączenie działa. ' + aiProvider(settings.provider).name + ' · ' + settings.model + ': poprawny format odpowiedzi z 2 punktami. Czas: ' + elapsed + ' s. Sprawdzono o ' + checkedAt + '. Zapisz ustawienia, jeśli je zmieniono.', 'success');
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
  const settings = currentSettings();
  try {
    validatePrompt();
    if (settings.mode === 'ai') validateSettings(settings);
    saveButton.disabled = true;
    await chrome.storage.local.set({routeSettings: {mode: settings.mode, provider: settings.provider, profiles: settings.profiles, customPrompt: settings.customPrompt, hubModel: settings.hubModel, modules: settings.modules}});
    promptStatus.textContent = settings.customPrompt === null ? 'Zapisano instrukcję domyślną.' : 'Zapisano Twoją instrukcję — będzie używana przy każdej analizie AI.';
    document.getElementById('postal-lab-link').hidden = !settings.modules.postalLab;
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
    await chrome.storage.local.set({routeSettings: {mode, provider: saved.provider, profiles: saved.profiles, customPrompt: saved.customPrompt, hubModel: saved.hubModel, modules: saved.modules}});
    profiles[deletingProvider].apiKey = '';
    if (selectedProvider === deletingProvider) { keyInput.value = ''; form.elements.mode.value = 'local'; showMode(); }
    settingsStatus.textContent = 'Usunięto klucz: ' + aiProvider(deletingProvider).name + '. Pozostałe klucze zachowano.';
  } catch { settingsStatus.textContent = 'Nie udało się usunąć klucza.'; }
});
(async () => {
  saveButton.disabled = true; showMode();
  try {
    const settings = await readRouteSettings();
    for (const [id, input] of moduleInputs) input.checked = settings.modules[id];
    document.getElementById('postal-lab-link').hidden = !settings.modules.postalLab;
    hubModelInput.value = settings.hubModel;
    promptInput.value = getAiRoutePrompt(settings);
    promptStatus.textContent = settings.customPrompt === null ? 'Używana jest instrukcja domyślna.' : 'Używana jest Twoja zapisana instrukcja.';
    profiles = settings.profiles; selectedProvider = settings.provider;
    providerInput.value = selectedProvider; form.elements.mode.value = settings.mode;
    loaded = true; showProvider(); saveButton.disabled = false;
  } catch { settingsStatus.textContent = 'Nie udało się odczytać ustawień. Otwórz tę stronę ponownie.'; }
})();
