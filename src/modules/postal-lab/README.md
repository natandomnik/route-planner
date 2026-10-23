# Isolated postal research experiment

## Files and functions

`postal-lab-ui.js`: initializes fixed example cases, handles run/cancel, renders source links with textContent, and clears/cancels results on settings changes. The entry page remains `/postal-lab.html`.

## Integration

Uses the postal-lookup service, but its own toggle controls the experiment independently of production clipboard research. No route/settings writes.

## Settings and lifecycle

Toggle: `routeSettings.modules.postalLab`. Default: enabled, preserving existing installations. Registry: `src/core/modules.js`. Settings UI and migration live in the core/UI layers.

Explicit user-triggered Groq research on four public examples. A disabled lab rejects even when its URL is opened directly. No background activity.

## Dependencies

Core provider/settings definitions and the ordered script entry points. No remote runtime scripts or new host permissions. User data and model outputs are untrusted; validate responses before display/use.

## Tests

`postal-lab.test.cjs`, `postal-lab.browser.cjs`, `modules.browser.cjs`. All automated provider responses are mocked.
