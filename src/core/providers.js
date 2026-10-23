'use strict';
// Fixed endpoints keep each provider's key confined to its own service.
const AI_PROVIDERS = Object.freeze({
  gemini: {
    name: 'Google Gemini', keyUrl: 'https://aistudio.google.com/apikey',
    models: [['gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite · lekki']],
    note: 'Limity i opłaty zależą od modelu oraz planu Google AI Studio.',
    privacy: 'Tekst zlecenia trafi do Google Gemini.'
  },
  openai: {
    name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', keyUrl: 'https://platform.openai.com/api-keys',
    models: [['gpt-6-luna', 'GPT-6 Luna · szybki'], ['gpt-5.4-mini', 'GPT-5.4 mini']],
    note: 'Płatne API. Dostęp i limity zależą od konta API OpenAI.',
    privacy: 'Tekst zlecenia trafi do OpenAI.'
  },
  groq: {
    name: 'Groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions', keyUrl: 'https://console.groq.com/keys',
    models: [['openai/gpt-oss-20b', 'GPT-OSS 20B · szybki, darmowy limit'], ['openai/gpt-oss-120b', 'GPT-OSS 120B · większy, darmowy limit']],
    note: 'Dostępny darmowy plan z limitami żądań i tokenów. Wyższe limity w planie płatnym. GPT-OSS jest tutaj obsługiwany przez Groq — użyj klucza Groq.',
    privacy: 'Tekst zlecenia trafi do Groq.'
  },
  openrouter: {
    name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', keyUrl: 'https://openrouter.ai/settings/keys',
    models: [['openrouter/free', 'Free Router · dostępny darmowy model']],
    note: 'Free Router dobiera darmowy model. Obowiązują limity; szybkość, jakość i dostępność mogą się zmieniać. Własny model może być płatny.',
    privacy: 'Tekst trafi do OpenRouter i dostawcy wybranego przez tę usługę.'
  }
});
function aiProvider(id) {
  if (!Object.hasOwn(AI_PROVIDERS, id)) throw new Error('Nieznany dostawca AI. Wybierz dostawcę w ustawieniach.');
  return AI_PROVIDERS[id];
}
function inferHubProvider(model) {
  if (!model || typeof model !== 'string') return 'groq';
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('openrouter/')) return 'openrouter';
  if (model.startsWith('gpt-')) return 'openai';
  for (const [providerId, config] of Object.entries(AI_PROVIDERS)) {
    if (config.models.some(([id]) => id === model)) return providerId;
  }
  return 'groq';
}
if (typeof module !== 'undefined' && module.exports) module.exports = {AI_PROVIDERS, aiProvider, inferHubProvider};
