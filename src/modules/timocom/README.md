# TimoCom route actions

Adds two isolated buttons (`Road Planner ↗` and `Google Maps ↗`) immediately below the offer map on `https://my.timocom.com/*`: open the current route in Road Planner or Google Maps. This optional module is controlled by `routeSettings.modules.timocom` in the common settings registry (enabled by default).

## Entry points and functions

- `content.js`: manifest content script. `routeFor()` finds the nearest offer scope containing one map and at least two uniquely indexed loading-place country/city pairs. `createActions()` builds a Shadow DOM toolbar using text nodes; clicks reread the current DOM. `scan()` reconciles toolbars after SPA mutations. `configure()` starts/stops observation and removes toolbars when disabled.
- `bridge.js`: imported by the service worker. `validTimocomPoints()` validates size, shape and control characters. The message handler checks the sender extension ID, exact TimoCom origin, target enum and current module setting. It creates only fixed Google Maps or extension URLs.
- `src/background.js`: `openReview(text, points)` stores a short-lived session handoff using a random ID; the URL contains the ID rather than offer addresses.
- `src/ui/popup.js`: consumes a validated TimoCom handoff into editable route fields, without rerunning the local parser or AI. Existing planner map settings still govern geocoding after import.

## Data and failure handling

Country and locality are read exclusively from `LoadingPlacesView/loadingPlaceCountry_N` and `loadingPlaceCity_N`. Numbered intermediate places retain order. No dates, times, customer details, full page HTML, or injected third-party correction controls are read. Map targeting uses the stable CSS-module prefix from the supplied markup. Ambiguous/missing offer scopes do not get buttons. The toolbar preserves the original map and uses separate styles. Source text is treated as untrusted and never rendered as HTML.

No network calls or AI/history capture occur in the content script. Google Maps receives the addresses only after its button is clicked. The planner receives addresses through extension session storage. There are no external scripts or additional API keys. Changing TimoCom markup may require selector maintenance; only the provided DOM contract has been tested, not the authenticated live site.

## Validation

`node tests/timocom.browser.cjs` uses synthetic offers and mocked Chrome APIs, blocks network access and verifies independent offer scoping, rereading edited fields, both actions and module disabling/re-enabling. `tests/timocom.test.cjs` verifies fixed destinations, ordered waypoints, rejected foreign senders, malformed input and disabled modules. `npm run check` validates syntax and extension assets.
