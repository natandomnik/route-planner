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
  const hubModel = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'].includes(saved.hubModel) ? saved.hubModel : 'openai/gpt-oss-120b';
  const customPrompt = typeof saved.customPrompt === 'string' && saved.customPrompt.trim() ? saved.customPrompt : null;
  return {mode: ['ai', 'gemini'].includes(saved.mode) ? 'ai' : 'local', provider, profiles, customPrompt, hubModel, ...profiles[provider]};
}
async function readRouteSettings() {
  const {routeSettings} = await chrome.storage.local.get('routeSettings');
  return normalizeRouteSettings(routeSettings || {});
}
