# AI route extraction

## Files and functions

`ai.js`: `parseWithAI` selects a fixed provider adapter and validates responses. `gemini.js`: `getAiRoutePrompt`, `waitForGeminiRetry`, `fetchGeminiWithRetry`, `parseWithGemini`, `validateAiRoute`; holds the shared extraction instruction/schema.

## Integration

Called explicitly from the popup or the settings connection check. Reads the selected provider profile and optional custom prompt. Never switches providers on failure.

## Settings and lifecycle

Toggle: `routeSettings.modules.aiExtraction`. Default: enabled, preserving existing installations. Registry: `src/core/modules.js`. Settings UI and migration live in the core/UI layers.

Gemini, OpenAI, Groq or OpenRouter fixed API endpoints. Disabled extraction rejects before requests. Popup changes cancel/discard stale requests.

## Dependencies

Core provider/settings definitions and the ordered script entry points. No remote runtime scripts or new host permissions. User data and model outputs are untrusted; validate responses before display/use.

## Tests

`providers.test.cjs`, `gemini.test.cjs`, `local-ai.browser.cjs`, `modules.*.cjs`. All automated provider responses are mocked.
