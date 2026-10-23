'use strict';
async function parseWithAI(text, settings, signal, onRetry, onResponse) {
  const provider = aiProvider(settings.provider);
  if (!settings.apiKey?.trim()) throw new Error('Dodaj klucz API dostawcy ' + provider.name + ' w ustawieniach.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(settings.model)) throw new Error('Nieprawidłowy identyfikator modelu.');
  if (settings.provider === 'gemini') return parseWithGemini(text, settings, signal, onRetry, onResponse);
  const payload = {
    model: settings.model,
    messages: [{role: 'system', content: getAiRoutePrompt(settings)}, {role: 'user', content: text}],
    response_format: {type: 'json_schema', json_schema: {name: 'transport_route', strict: true, schema: AI_ROUTE_SCHEMA}},
    max_completion_tokens: 8192
  };
  if (settings.provider === 'openai') {
    payload.store = false;
    if (settings.model === 'gpt-6-luna') payload.reasoning_effort = 'none';
    if (settings.model === 'gpt-5.4-mini') payload.reasoning_effort = 'low';
  }
  if (settings.provider === 'groq' && settings.model.startsWith('openai/gpt-oss-')) payload.reasoning_effort = 'low';
  if (settings.provider === 'openrouter') {
    delete payload.max_completion_tokens; payload.max_tokens = 8192;
    payload.provider = {require_parameters: true};
  }
  let response;
  try {
    response = await fetchGeminiWithRetry(provider.endpoint, {
      method: 'POST', signal, redirect: 'error',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + settings.apiKey.trim()},
      body: JSON.stringify(payload)
    }, onRetry, provider.name);
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('Nie udało się połączyć z ' + provider.name + '. Sprawdź internet i przeładuj wtyczkę, aby nadać jej dostęp do API.');
  }
  if (!response.ok) {
    const messages = {
      400: 'Odrzucono żądanie. Sprawdź model i jego obsługę odpowiedzi JSON ze schematem.',
      401: 'Nieprawidłowy lub wygasły klucz API.',
      402: 'Brak środków lub dostępu w bieżącym planie. Sprawdź rozliczenia.',
      403: 'Brak dostępu. Sprawdź uprawnienia klucza, modelu i konta.',
      404: 'Model jest niedostępny. Wybierz inny model.',
      429: 'Przekroczono limit zapytań, tokenów lub środków. Sprawdź limity i rozliczenia.'
    };
    throw new Error(provider.name + ': ' + (messages[response.status] || 'Usługa jest niedostępna (HTTP ' + response.status + '). Spróbuj później lub wybierz innego dostawcę.'));
  }
  let body;
  try { body = await response.json(); } catch { throw new Error(provider.name + ': nieprawidłowa odpowiedź usługi.'); }
  const choice = body.choices?.[0];
  onResponse?.(typeof choice?.message?.content === 'string' ? choice.message.content : '');
  if (!choice || choice.finish_reason !== 'stop' || choice.message?.refusal) throw new Error(provider.name + ': brak pełnej odpowiedzi modelu. Skróć tekst lub wybierz inny model.');
  let result;
  try { result = JSON.parse(choice.message.content); } catch { throw new Error(provider.name + ': model nie zwrócił poprawnego JSON. Spróbuj innego modelu.'); }
  return validateAiRoute(result, provider.name);
}
