# Endpoint search-area suggestions

## Files and functions

`hubs.js`: `findRouteHubs` searches around the selected A/B anchor; `validateHubSuggestions` filters invalid/duplicate/out-of-range suggestions; `HUB_PROMPT` describes freight-oriented selection.

## Integration

Popup compass controls at the first/last point display non-mutating suggestion chips. Ordered route and selected endpoint provide context. The `hubModel` setting chooses among available configured models (Groq, Google Gemini, OpenAI, OpenRouter).

## Settings and lifecycle

Toggle: `routeSettings.modules.hubSuggestions`. Default: enabled, preserving existing installations. Registry: `src/core/modules.js`. Settings UI and migration live in the core/UI layers.

Supports Groq, Google Gemini, OpenAI, and OpenRouter using the user's configured provider API keys. Disabled service rejects before requests. Route/settings changes invalidate results; a repeated in-flight click cancels. Geographic assertions remain model estimates, not independent routing evidence.

## Dependencies

Core provider/settings definitions and the ordered script entry points. No remote runtime scripts or new host permissions. User data and model outputs are untrusted; validate responses before display/use.

## Tests

`hubs.test.cjs`, `hubs.browser.cjs`, `modules.*.cjs`. All automated provider responses are mocked.
