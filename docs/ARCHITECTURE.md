# File and function map

This map describes the modular structure of Road Planner. The initial flat-layout snapshot remains in tag v1.5.0. Root HTML URLs are preserved so existing links and context-menu flows continue to work.

## `src/background.js`

Context-menu service worker; captures selection and opens a separate review page.

Functions: `openReview`.

## `src/ui/popup.js`

Popup controller: local/AI parsing, route editing, status, undo, suggestions and copy orchestration.

Functions: `setAnalyzing`, `cancelAnalysis`, `refreshMode`, `message`, `persist`, `updateOpen`, `paintHubSuggestions`, `toggleHubSuggestions`, `insertPoint`, `movePoint`, `clearDrag`, `markDrop`, `dropPoint`, `renderPoints`, `insertSlot`, `showDetails`, `displayResult`, `analyzeLocal`, `analyzeAI`, `initialize`.

## `src/ui/options.js`

Settings form: provider profiles, prompt editing, connection testing and persistence.

Functions: `currentModel`, `captureProfile`, `currentSettings`, `showProvider`, `showMode`, `connectionMessage`, `resetConnection`, `validatePrompt`, `validateSettings`.

## `src/core/providers.js`

Fixed provider endpoints, model choices and display metadata.

Functions: `aiProvider`.

## `src/core/settings.js`

Settings defaults, legacy migration and local storage read.

Functions: `normalizeRouteSettings`, `readRouteSettings`.

## `src/core/transport-maps-parser.js`

Local route parser, Maps URL builder and deterministic clipboard formatting.

Functions: `readFields`, `normalize`, `split`, `parsePoint`, `parseRoute`, `addresses`, `buildUrl`, `formatClipboardPoint`, `formatClipboardRoute`, `enrichClipboardPoints`, `parseAddresses`, `parseTransportRoute`, `buildGoogleMapsUrl`.

## `src/modules/ai-extraction/gemini.js`

Shared AI prompt/schema, Gemini adapter, retries and AI response validation.

Functions: `getAiRoutePrompt`, `waitForGeminiRetry`, `fetchGeminiWithRetry`, `parseWithGemini`, `validateAiRoute`.

## `src/modules/ai-extraction/ai.js`

Provider dispatcher and chat-completion adapters.

Functions: `parseWithAI`.

## `src/modules/postal-lookup/postal-lab.js`

Groq web-based postal research request and validation; shared with copy.

Functions: `validatePostalTest`, `runPostalTest`.

## `src/modules/postal-lab/postal-lab-ui.js`

Isolated experiment controller and result rendering.

Functions: DOM event handlers and initialization.

## `src/modules/hub-suggestions/hubs.js`

Search-area instruction, multi-provider model requests (Groq, Gemini, OpenAI, OpenRouter) and suggestion validation.

Functions: `validateHubSuggestions`, `findRouteHubs`, `inferHubProvider`.

## Pages and configuration

- `manifest.json`: extension version, permissions, popup, service worker and options page.
- `popup.html`: route editor markup and ordered script entry points.
- `options.html`: settings markup and ordered scripts.
- `postal-lab.html`: isolated experiment page.
- `assets/styles/popup.css`: shared styling, editor layout, busy indicators and suggestion chips.

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

## Feature registry and test infrastructure

- `src/core/modules.js`: `ROUTE_MODULES` defines stable identifiers and default flags; `normalizeRouteModules` migrates incomplete settings without switching existing functionality off.
- `src/core/settings.js`: `normalizeRouteSettings` also returns normalized module flags; `readRouteSettings` reads browser-local settings.
- `src/ui/options.js`: `currentModules` collects switches; options save/delete-key flows retain flags, keys, provider model choices and custom prompt.
- `tests/helpers/browser.cjs`: `launchOptions` chooses a test browser; `artifactPath` creates ignored test-artifact paths.
- `scripts/check-extension.cjs`: validates manifest/page paths, script load order, runtime/package version agreement and JavaScript syntax.
- `scripts/run-browser-tests.cjs`: runs all `*.browser.cjs` scripts sequentially and propagates failures.
- `package.json` / `package-lock.json`: pinned development tooling; no production runtime packages.
- `.github/workflows/ci.yml`: runs validation, unit tests and browser tests on feature/fix/main pushes and pull requests, with read-only contents permission.
- `.github/pull_request_template.md`: required review context and owner-approval reminder.
- `.gitignore`: excludes secrets, browser state, dependencies and generated files.

## Optional feature boundaries

Service modules validate data and issue provider requests; the popup controller owns editable route state and DOM. Optional features do not own or overwrite local routes. Disabling a feature cancels/discards active work through the settings-change listeners. Postal lookup off means copy formats the existing points without network calls. Hub suggestions off hides its endpoint controls/results. AI extraction off hides its button and rejects the keyboard/API path. The disabled postal experiment rejects direct-page execution.

Root HTML pages deliberately remain at the same URLs. The background worker path is explicitly updated in the manifest. This is a no-bundler extension: ordered local script tags establish dependencies, with the module registry loaded before settings.

## `src/modules/suggestion-map/`

Leaflet renderer, Geoapify geocoding/driving-distance adapter and bundled orientation data. `SuggestionMap.update/open/close/highlight/resetDistance` manage lifecycle and incremental rendering; `MapLocationValidation.expected/parameters/matches` enforce the address contract; `addMapContext` manages zoom-aware borders, cities and parking labels. See the module README and `CONTEXT-DATA.md`.

## `src/modules/recognition-history/`

`history.js` provides per-profile IndexedDB raw-input capture and list/update/remove/clear operations. `history-ui.js` renders redaction and export controls in `history.html`. `examples.json` contains synthetic parser examples, never real history. Only explicit AI recognition captures input; model output is not exported.

## `src/modules/timocom/`

`content.js` reads the current offer's country/locality fields, scopes map buttons and observes SPA updates. `bridge.js` validates content-script messages and opens fixed extension/Google Maps destinations. `openReview` stores a session handoff and the popup imports ordered points directly. The registry toggle controls availability; no AI request is used for import.
