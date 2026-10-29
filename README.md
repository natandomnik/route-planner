# Road Planner

Private Chrome/Chromium Manifest V3 extension for freight forwarders. Turns an informal transport message into an editable route, opens Google Maps in the current tab, and copies a compact list of route addresses.

**Current stable version: 1.8.1** ([release](https://github.com/natandomnik/Trasa-do-Maps/releases/tag/v1.8.1)). The product interface is Polish; development documentation and built-in LLM instructions are English. Polish development requests are interpreted as English implementation requirements; owner-facing replies remain Polish. Original route data and saved custom prompts are preserved.

## Features

- Local parsing on paste, including country codes, postal codes and intermediate stops.
- Explicit AI extraction using Gemini, OpenAI, Groq or OpenRouter, with a saved custom prompt.
- Drag-and-drop route editing, insertion/removal, and undo of AI extraction.
- Clipboard export: one address per line, with optional Groq postal-code research.
- Radius/corridor carrier-search areas around A/B using an independently selected provider/model.
- Interactive Leaflet map, driving distances, local logistics/parking context and incremental suggestion markers.
- TimoCom offer buttons that open the ordered route in Road Planner or Google Maps.
- Optional local raw-input history and export for parser improvement, plus an offline demo provider.
- Isolated postal-code research experiment in settings.

Suggestions are search areas, not live vehicle offers. Model-supplied postcodes, sources and distances may be wrong. Google Maps car routes do not account for truck restrictions.

## Install locally

1. Keep this checkout in a stable folder.
2. Open `chrome://extensions`, enable Developer mode and choose **Load unpacked**.
3. Select the folder containing `manifest.json`.
4. Pin the extension and open **Ustawienia** to configure optional AI features.

After updating, reload the extension and reopen its popup/settings pages. Keep the same folder path to preserve the unpacked extension identity and browser settings. Node.js and an API key are not needed for local parsing.

## Credentials and privacy

API keys belong only in extension settings. They are stored in `chrome.storage.local`, not in this repository or Chrome Sync. The store is not an encrypted vault. Route drafts use session storage. AI requests happen on explicit actions; provider keys are sent only to fixed provider endpoints. Postal lookup uses the saved Groq key; hub suggestions use the selected provider profile. With the map module enabled and a map key configured, recognized route points are automatically geocoded by Geoapify to calculate driving distance. Optional history stores raw textarea input only when AI recognition is clicked, with up to 500 records per browser profile. Never commit browser profiles, real orders or credentials.

## Development and versioning

- `main`: stable, approved code. Initial publication is version `1.5.0`.
- `feature/<topic>`: new features and refactoring.
- `fix/<topic>`: bug fixes.
- Use Conventional Commits, for example `feat(hubs): add search-area toggle`.
- Every release updates `manifest.json`, `CHANGELOG.md`, and has an annotated `vX.Y.Z` tag.
- Develop and test locally first. Push branches, tags or releases only after explicit owner approval. Local commits are allowed.
- **Do not merge into `main` without the owner's explicit approval.**

See [AGENTS.md](AGENTS.md), [architecture](docs/ARCHITECTURE.md), [release process](docs/RELEASING.md), and [changelog](CHANGELOG.md).

## Tests

Use Node.js 22 or newer:

```sh
npm ci
npx playwright install chromium
npm run test:all
```

`npm run check` checks entry points, script loading, versions and syntax. `npm test` runs unit tests. `npm run test:browser` runs browser regressions with fake API responses. `CHROME_PATH` can select an installed browser; otherwise Playwright Chromium is used (installed Chrome is also detected on macOS). Test output is ignored under `test-results/`.

## Project layout

```text
manifest.json                 Runtime version and extension entry points
popup.html / options.html     Stable root page URLs
postal-lab.html               Stable experiment page URL
src/background.js             Context-menu service worker
src/core/                     Parser, providers, settings and module registry
src/ui/                       Popup and settings controllers
src/modules/ai-extraction/    Provider adapters and extraction instruction
src/modules/postal-lookup/    Postal research service used by copy
src/modules/hub-suggestions/  Endpoint carrier-search areas
src/modules/postal-lab/       Isolated experiment controller
src/modules/suggestion-map/   Leaflet, geocoding, routing and local map context
src/modules/recognition-history/ Local raw-input history and synthetic examples
src/modules/timocom/          Offer DOM adapter and validated background bridge
assets/styles/                Shared product styling
tests/                        Unit and mocked browser checks
scripts/                      Portable validation/test runners
docs/                         Architecture, module contract and release process
docs/legacy/                  English translations of historical notes
.github/                      Pull request template and CI
```

## Optional modules

Settings → **Moduły** contains independent switches for AI extraction, postal lookup on copy, A/B suggestions, the postal experiment, the map, raw-input history and TimoCom integration. All default to enabled for existing installations. Disabling them does not remove saved keys or the custom prompt. Ordinary local parsing, manual route editing, Google Maps opening and plain clipboard export remain available. AI mode is a separate prerequisite for model features. Map requests use an independent Geoapify key. TimoCom import does not invoke AI.

See [module development contract](docs/MODULES.md) and each module's README. Module flags are centralized in `src/core/modules.js` and persisted in `routeSettings.modules`.

## Legacy notes

[INSTALACJA.md](docs/legacy/INSTALACJA.md) contains the English translation of the historical installation/version notes. [TEST-KODOW.md](docs/legacy/TEST-KODOW.md) records the exploratory postal-code experiment. They are maintained as English translations of historical documents; current development guidance is in the English docs.

No public/open-source license is granted by this repository.

## GitHub configuration

The repository is private and auto-merge is disabled. Server-side protection of main was rejected by GitHub because this account requires Pro for protected private branches. See [setup status](docs/GITHUB-SETUP.md). No feature PR may be merged without explicit owner approval.
