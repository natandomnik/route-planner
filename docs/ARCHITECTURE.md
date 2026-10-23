# File and function map

This map describes the initial 1.5.0 snapshot. Module organization is developed on a feature branch.

## `background.js`

Context-menu service worker; captures selection and opens a separate review page.

Functions: `openReview`.

## `popup.js`

Popup controller: local/AI parsing, route editing, status, undo, suggestions and copy orchestration.

Functions: `setAnalyzing`, `cancelAnalysis`, `refreshMode`, `message`, `persist`, `updateOpen`, `paintHubSuggestions`, `toggleHubSuggestions`, `insertPoint`, `movePoint`, `clearDrag`, `markDrop`, `dropPoint`, `renderPoints`, `insertSlot`, `showDetails`, `displayResult`, `analyzeLocal`, `analyzeAI`, `initialize`.

## `options.js`

Settings form: provider profiles, prompt editing, connection testing and persistence.

Functions: `currentModel`, `captureProfile`, `currentSettings`, `showProvider`, `showMode`, `connectionMessage`, `resetConnection`, `validatePrompt`, `validateSettings`.

## `providers.js`

Fixed provider endpoints, model choices and display metadata.

Functions: `aiProvider`.

## `settings.js`

Settings defaults, legacy migration and local storage read.

Functions: `normalizeRouteSettings`, `readRouteSettings`.

## `transport-maps-parser.js`

Local route parser, Maps URL builder and deterministic clipboard formatting.

Functions: `readFields`, `normalize`, `split`, `parsePoint`, `parseRoute`, `addresses`, `buildUrl`, `formatClipboardPoint`, `formatClipboardRoute`, `enrichClipboardPoints`, `parseAddresses`, `parseTransportRoute`, `buildGoogleMapsUrl`.

## `gemini.js`

Shared AI prompt/schema, Gemini adapter, retries and AI response validation.

Functions: `getAiRoutePrompt`, `waitForGeminiRetry`, `fetchGeminiWithRetry`, `parseWithGemini`, `validateAiRoute`.

## `ai.js`

Provider dispatcher and chat-completion adapters.

Functions: `parseWithAI`.

## `postal-lab.js`

Groq web-based postal research request and validation; shared with copy.

Functions: `validatePostalTest`, `runPostalTest`.

## `postal-lab-ui.js`

Isolated experiment controller and result rendering.

Functions: DOM event handlers and initialization.

## `hubs.js`

Search-area instruction, web-enabled Groq request and suggestion validation.

Functions: `validateHubSuggestions`, `findRouteHubs`.

## Pages and configuration

- `manifest.json`: extension version, permissions, popup, service worker and options page.
- `popup.html`: route editor markup and ordered script entry points.
- `options.html`: settings markup and ordered scripts.
- `postal-lab.html`: isolated experiment page.
- `popup.css`: shared styling, editor layout, busy indicators and suggestion chips.

## Tests

- `tests/clipboard.test.cjs`: Node unit/regression checks.
- `tests/copy-postal.browser.cjs`: browser/UI integration checks with mocked APIs.
- `tests/gemini.test.cjs`: Node unit/regression checks.
- `tests/hubs.browser.cjs`: browser/UI integration checks with mocked APIs.
- `tests/hubs.test.cjs`: Node unit/regression checks.
- `tests/local-ai.browser.cjs`: browser/UI integration checks with mocked APIs.
- `tests/postal-lab.browser.cjs`: browser/UI integration checks with mocked APIs.
- `tests/postal-lab.test.cjs`: Node unit/regression checks.
- `tests/postal-routes.test.cjs`: Node unit/regression checks.
- `tests/providers.test.cjs`: Node unit/regression checks.

## Data flow

Selection/paste → local parser → editable points. Explicit AI extraction sends the original message to the selected provider. Explicit clipboard research sends current points to Groq; validated additions affect the clipboard, not route inputs. Endpoint suggestion requests send the ordered route plus the selected anchor to Groq. All remote results remain untrusted suggestions.

## Future module contract

See AGENTS.md: separate folder, documented entry points, explicit settings toggle, no requests when disabled, cancellation and tests. Core state belongs to the popup controller; feature services should not mutate route state directly.
