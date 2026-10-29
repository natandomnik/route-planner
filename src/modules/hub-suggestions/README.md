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

## Suggestion strategies

`routeSettings.strategy` is `radius` (legacy default) or `corridor`. The settings selector updates the read-only prompt preview; extraction custom prompts remain untouched. The full ordered route, selected anchor, role and strategy go to every provider. In-memory result records retain their strategy and are invalidated on route/settings changes.

Radius retains L/N/S/E/W/HUB 1/HUB 2 and the 10–115 km limit relative to the clicked endpoint. Corridor splits results by role: A gets PODJAZD, TRASA 1/2 and HUB 1/2; B gets ZJAZD, POWRÓT and REGION. A evaluates candidate X -> A -> B approaches; B evaluates onward B -> X travel, including relevant cross-border catchments. Distances are estimated X -> A for A and B -> X for B, not whole-route distances. Preferred ranges are 1–30 km for PODJAZD, up to 30–50 km for TRASA, and roughly 115 km for hubs and B candidates. Validation allows modest extensions with sanity ceilings of 50, 70 and 150 km respectively. Prompts require explanations for departures from preferred ranges. Both shipment endpoints and wrong-role categories are excluded. These suggestions do not establish actual vehicle availability, parking or return loads. No routing engine is connected to the LLM selection step; model estimates remain unverified.

The offline provider uses explicitly marked local fixtures with the same eight/six split. It performs no network research. The UI abbreviates HUB 1/2 to H1/H2 and shows bare rounded distance numbers; the distance link tooltip identifies kilometres and the endpoint. Clipboard export includes only the address.

Corridor returns up to eight A candidates and six B candidates. Labels may repeat twice for distinct towns; locality deduplication and distance checks still apply. Radius retains its existing seven-category behaviour.
