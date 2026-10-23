# Clipboard postal research

## Files and functions

`postal-lab.js`: `runPostalTest` sends a web-enabled Groq request for supplied cases; `validatePostalTest` validates results. `POSTAL_TEST_PROMPT` defines conservative research rules. The legacy filename is retained to avoid unnecessary API renaming.

## Integration

The popup copy handler calls the service with the current ordered points. `TransportMaps.enrichClipboardPoints` merges only accepted additions for clipboard output, preserving original route inputs.

## Settings and lifecycle

Toggle: `routeSettings.modules.postalLookup`. Default: enabled, preserving existing installations. Registry: `src/core/modules.js`. Settings UI and migration live in the core/UI layers.

Groq GPT-OSS 20B with browser_search, using only the saved Groq key. Disabled lookup bypasses this service; plain copy remains available. Failures/timeouts copy existing points.

## Dependencies

Core provider/settings definitions and the ordered script entry points. No remote runtime scripts or new host permissions. User data and model outputs are untrusted; validate responses before display/use.

## Tests

`postal-lab.test.cjs`, `clipboard.test.cjs`, `copy-postal.browser.cjs`, `modules.*.cjs`. All automated provider responses are mocked.
