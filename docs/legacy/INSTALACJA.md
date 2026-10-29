# Route Planner — historical installation and usage (1.5.0)

English translation of the historical guide for the extension formerly named Trasa do Maps. Version-specific sections describe past behavior. Original Polish text remains in Git history. UI actions are described in English; the interface remains Polish. Historical backup paths and filenames are unchanged.

## Installation and updates

1. Keep the extension folder in a stable location.
2. Open `chrome://extensions` in Chrome. This is the extension management page, not an option in extension details.
3. Enable Developer mode, select Load unpacked and choose the folder containing `manifest.json`.
4. Pin Route Planner in the extensions menu.

After updating, click Reload on the extension card, close old preview windows/tabs and reopen the extension. This historical guide describes version **1.5.0**. If an older version appears, check that you updated the folder Chrome loaded. New integrations require API-domain permissions; accept them if Chrome requests them.

Local mode needs no Node.js, compilation or API key.

## Preparing a route

- Open the extension and paste an order. Local recognition runs after a short typing pause. Recalculate locally repeats it. If points are missing, use Recognize with AI or Ctrl/Command+Enter.
- Alternatively, select webpage text and use the context-menu action to prepare a Google Maps route. The separate review tab automatically parses locally, even when AI is configured.
- Correct addresses. Drag dotted handles to reorder points, or focus a handle and use up/down arrow keys.
- Click the plus line between points to insert an address. Add point appends one; × removes a point.
- Editing source text automatically reruns local recognition. Manual address corrections require no reanalysis.
- Open route in Google Maps replaces the active webpage when using the popup, or the review tab when using a separate tab.

Routes require 2–11 nonempty points. A is the origin, B the destination; other points are stops. Excessively long URLs are blocked. To build a route manually, recalculate with empty source text and add points.

## Settings and AI providers

Settings opens directly in a new tab. Local only uses built-in processing without sending orders or incurring API charges. Local plus AI on click requires a provider, model and API key; initial parsing remains local and only the explicit button/shortcut invokes AI.

Historical provider choices:

| Provider | Listed models | Cost and notes |
| --- | --- | --- |
| Google Gemini | Gemini 3.1 Flash-Lite | Limits and charges depend on the Google plan. |
| OpenAI | GPT-6 Luna, GPT-5.4 mini | Paid API; access depends on the API account. |
| Groq | GPT-OSS 20B, GPT-OSS 120B | Free plan with limits; paid plans increase limits. Use a Groq key despite the `openai/` model prefix. |
| OpenRouter | Free Router (`openrouter/free`) | Selects an available free model; limits, speed and quality vary. |

Each provider retains its own key and model. Migration to 1.2.0 preserves the existing Gemini key. Save settings explicitly. Other model accepts a text-model identifier supporting JSON schema responses; it may incur charges.

Switch providers manually when one is unavailable: enter the appropriate key, test and save. The extension does not resend an order to a different provider after an error. OpenRouter Free Router itself selects a model/provider within its service.

Key pages:
- Gemini: https://aistudio.google.com/apikey
- OpenAI: https://platform.openai.com/api-keys
- Groq: https://console.groq.com/keys
- OpenRouter: https://openrouter.ai/settings/keys

## Connection check

Tests the current provider, entered key and model without saving settings. It sends a sample Warszawa–Berlin route through the extraction mechanism and checks response format and two points. It sends no customer orders but consumes API tokens.

The success message reports the model, elapsed time and check time for one request, not continuous monitoring. Changing provider/model/key clears it. Save changed settings afterwards.

HTTP 500/502/503/504 receive up to two retries with increasing delays within a 45-second total timeout. Key, billing and quota errors are not automatically retried. HTTP 503 indicates unavailability and does not establish key validity.

## Data and limitations

Local parsing runs on the device. AI sends the entire analyzed source text to the selected provider. OpenRouter forwards it to its selected backend. Charges, limits and processing depend on the service/account.

Keys/settings use `chrome.storage.local` without synchronization; it is not an encrypted vault. Never put keys in extension files. Deleting a provider key preserves others and enables local mode if that provider is active in saved settings.

Drafts use session storage and may disappear on browser closure or extension reload. Reopening a draft does not resend it to an API. Keep the popup open during analysis: closure may interrupt a request already billed by the provider.

Review all results. The extension does not geocode, verify city/postcode correspondence or optimize order. Warnings describe original recognition and may remain after manual corrections. Google Maps uses car routing without truck restrictions. Addresses enter the URL and may appear in browser history.

Permissions include context menus, extension storage and API access to `generativelanguage.googleapis.com`, `api.openai.com`, `api.groq.com` and `openrouter.ai`. No analytics or external runtime libraries are used.

## Verification

`node --test tests/*.test.cjs` tests validation, settings migration, key isolation, provider requests, retries and errors locally with simulated responses. Test real connections in settings with your own key.

Provider documentation recorded as checked on 2026-10-22:
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/structured-outputs
- https://openrouter.ai/openrouter/free
- https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite

## AI instruction (1.3.0)

Settings → Local plus AI on click → AI instruction exposes the exact system prompt and JSON schema. The editable custom prompt is saved locally and used across providers.

The model receives complete original text without preprocessing as a separate user message. The instruction removes metadata, preserves order/repetitions and accepts country plus full postcode as a point. For `de 02826 do pl 05 870`, expected points are `02826, Germany` and `05-870, Poland`. Local parsing also supports spaces inside Polish postcodes.

The main view omits request details/raw JSON; analysis details are no longer stored in drafts. Editable addresses and warnings remain. Validation checks JSON structure/types, not completeness or postcode existence.

## Local first, AI on demand (1.3.0)

Pasting, typing or passing selected text runs local parsing without API calls. The AI button or Ctrl/Command+Enter sends original text to the configured model. Status distinguishes local recognition from AI and identifies the provider.

On AI failure, previous points/corrections remain. After success, Undo AI restores the previous list and manual corrections until source changes, local reanalysis or view closure.

Extract all pickup, extra loading, delivery and intermediate stops. `de 02826 do pl 05 870, po drodze rozładunek pl 59 900` should yield DE 02826 → PL 59-900 → PL 05-870. Itinerary cues take priority over mention order. This instruction is not a guarantee; review results. Google Maps receives intermediate stops through `waypoints`.

## Custom AI instruction (1.4.0)

Edit and save the prompt in settings. It fully replaces the default and survives browser restarts and extension reloads. Provider/model changes or key deletion do not remove it. Uninstalling or clearing extension data does.

Restore default fills the editor; save to retain it. Empty prompts are rejected; the limit is 20,000 characters. JSON arrays `points` and `warnings` remain the required schema. Source text remains a separate user message.

Connection checking uses current editor content, including unsaved changes. Popup analysis uses the saved instruction. Default updates never overwrite custom prompts. Version 1.4.2 displays the provider and full selected model ID beneath the header; a disabled annotation indicates local mode.

## Changes in 1.4.2

Links below Google Maps open Mapy.com, OSM and HERE in the current tab without transferring route points.

The default prompt retains cities with abbreviated postcodes: `DE 57 Siegen ➞ PL 39 Ropczyce` becomes `Siegen, Germany` → `Ropczyce, Poland`. It does not guess full codes. Validation rejects bare DE/PL prefixes, preserving previous points. To adopt a new default instead of an existing custom prompt, restore it in settings and save.

## Changes in 1.4.3

Other-map links were removed. The copy icon right of Add point copies one address per line without numbering/arrows, preserving order, duplicates and corrections. Copy is disabled for empty points, pending local recognition or active analysis.

## Changes in 1.4.4

Copy labels the first point `A >`, last `B •`, and intermediate points `+1`, `+2`, etc., with addresses on the same lines. Country names become leading ISO2 codes, e.g. `A > DE 57072 Siegen`. Existing codes, names and details remain; missing data is not guessed. Copy makes no AI/address-service request.

## Changes in 1.4.5

Copy removes A/B and numbering: the first address ends with `>`, the last with `•`, intermediate addresses start with `+ `.

## Postal research experiment (1.4.6)

A settings link opens `postal-lab.html`. An explicit click tests four public examples through Groq GPT-OSS 20B with `browser_search`, using the saved Groq key independently of the selected provider. It saves no settings/results and changes no points, clipboard content or custom prompt. Timeout: 120 seconds; cancellation is available.

See `TEST-KODOW.md` for live results. At this stage the experiment was NOT connected to normal parsing/copying because a repeated test produced a contradictory answer.

### Historical rollback to 1.4.5

Recorded backup: `../Trasa-do-Maps-backup-1.4.5-20261022-224052.zip`, containing `Trasa-do-Maps`. The original procedure extracted it separately, restored files to the existing extension path and reloaded. Extra `postal-lab.html`, `postal-lab.js`, `postal-lab-ui.js`, `TEST-KODOW.md` and `tests/postal-lab.*.cjs` files could be removed because the old version did not load them. Keys/custom prompts remain in browser storage and are not in the archive. For current Git-managed rollback, follow `../RELEASING.md`.

## Postal lookup on copy (1.4.7)

Copy checks current points through Groq `openai/gpt-oss-20b` with web search. It requires AI mode and a saved Groq key. Only current points are sent, not the complete order. Searches may consume paid quota. The fixed postal model and separate address instruction are independent of the extraction provider/custom prompt.

Clipboard output has one address per line without A/B, arrows, plus signs or numbering:

```text
DE Siegen
PL 39-100 Ropczyce
```

Missing country/postcode additions require an unambiguous status and source. Local validation checks formats/country conflicts and never overwrites existing codes, names or details. It is not independent postal-database verification. Uncertain/unsupported additions are skipped. API failure, missing key, local mode or the 60-second timeout copies original points and explains why enrichment was skipped.

Route fields remain unchanged. Route edits during lookup prevent stale copying. Keep the popup open until completion. `clipboardWrite` permits writing after the API response; Chrome may require reenabling the extension after updating permissions.

Recorded previous backup: `../Trasa-do-Maps-backup-1.4.6-20261022-224621.zip`. Restore to the same loaded path and reload. `TEST-KODOW.md` describes the experiment before production integration.

## Copy activity indicator (1.4.8)

A rotating spinner replaces the copy icon during research/writing. Success, error or cancellation restores the icon. Reduced-motion settings produce a stationary indicator.

## A/B search-area suggestions (1.5.0)

A compass appears at the first/last points, left of ×. Clicking sends current points, anchor and role to Groq. A searches around pickup, B around final delivery; the whole route is context. Results are carrier-search areas, not confirmed offers/availability, and do not alter the route.

A wrapping row shows L/N/S/E/W/HUB 1/HUB 2 and COUNTRY POSTCODE CITY. Clicking again toggles results or cancels an active request. Editing/reordering points, analysis or settings changes clear old results. Timeout: 90 seconds. Missing keys, quotas or absent confirmed proposals produce a brief inline message.

Rules were extracted from `06_sugerowanie_punktow_zaladunku.md`: significant industrial/road centres, neighbours at least 10 km away, four directions and two nearest hubs within 115 km. Unsupported percentages, availability guarantees and elaborate report formatting were excluded. The source document was unchanged.

The original prompt requested web verification of codes, logistics relevance and road access. Validation removes duplicate places/labels, incomplete supported-country codes, missing sources and declared distances outside 10–115 km. It is not an independent geocoder/router; review sources, directions and distances. Fewer results are preferable to artificially filling seven categories.

The separate model setting selects default `openai/gpt-oss-120b` or faster `openai/gpt-oss-20b`. In this historical release both use the Groq key and browser_search, requiring AI mode. Limits/costs depend on the account. The custom extraction prompt is unchanged; the suggestions prompt is visible in settings.

Recorded pre-change backup: `../Trasa-do-Maps-backup-1.4.8-20261022-230110.zip`. Restore to the same loaded path and reload.
