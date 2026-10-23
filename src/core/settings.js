'use strict';
function normalizeRouteSettings(saved = {}) {
  const provider = Object.hasOwn(AI_PROVIDERS, saved.provider) ? saved.provider : 'gemini';
  const profiles = {};
  for (const [id, config] of Object.entries(AI_PROVIDERS)) {
    const profile = saved.profiles?.[id] || {};
    profiles[id] = {
      model: typeof profile.model === 'string' && profile.model ? profile.model : config.models[0][0],
      apiKey: typeof profile.apiKey === 'string' ? profile.apiKey : ''
    };
  }
  // Migrate the original Gemini-only settings without losing the user's key.
  if (!saved.profiles?.gemini) {
    if (typeof saved.apiKey === 'string') profiles.gemini.apiKey = saved.apiKey;
    if (typeof saved.model === 'string' && saved.model) profiles.gemini.model = saved.model;
  }
  const modules = normalizeRouteModules(saved.modules);
  const hubModel = typeof saved.hubModel === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(saved.hubModel)
    ? saved.hubModel
    : 'openai/gpt-oss-120b';
  const hubProvider = Object.hasOwn(AI_PROVIDERS, saved.hubProvider)
    ? saved.hubProvider
    : (typeof inferHubProvider === 'function' ? inferHubProvider(hubModel) : 'groq');
  const customPrompt = typeof saved.customPrompt === 'string' && saved.customPrompt.trim() ? saved.customPrompt : null;
  return {mode: ['ai', 'gemini'].includes(saved.mode) ? 'ai' : 'local', provider, profiles, customPrompt, hubModel, hubProvider, modules, ...profiles[provider]};
}
async function readRouteSettings() {
  const {routeSettings} = await chrome.storage.local.get('routeSettings');
  return normalizeRouteSettings(routeSettings || {});
}
if (typeof module !== 'undefined' && module.exports) module.exports = {normalizeRouteSettings, readRouteSettings};
