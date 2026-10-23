# Trasa do Maps

Private Chrome/Chromium Manifest V3 extension for freight forwarders. Turns an informal transport message into an editable route, opens Google Maps in the current tab, and copies a compact list of route addresses.

**Current stable version: 1.5.0.** The product interface is Polish; development documentation is English.

## Features

- Local parsing on paste, including country codes, postal codes and intermediate stops.
- Explicit AI extraction using Gemini, OpenAI, Groq or OpenRouter, with a saved custom prompt.
- Drag-and-drop route editing, insertion/removal, and undo of AI extraction.
- Clipboard export: one address per line, with optional Groq postal-code research.
- Suggested carrier-search areas around endpoints A/B, using a separate Groq model.
- Isolated postal-code research experiment in settings.

Suggestions are search areas, not live vehicle offers. Model-supplied postcodes, sources and distances may be wrong. Google Maps car routes do not account for truck restrictions.

## Install locally

1. Keep this checkout in a stable folder.
2. Open `chrome://extensions`, enable Developer mode and choose **Load unpacked**.
3. Select the folder containing `manifest.json`.
4. Pin the extension and open **Ustawienia** to configure optional AI features.

After updating, reload the extension and reopen its popup/settings pages. Keep the same folder path to preserve the unpacked extension identity and browser settings. Node.js and an API key are not needed for local parsing.

## Credentials and privacy

API keys belong only in extension settings. They are stored in `chrome.storage.local`, not in this repository or Chrome Sync. The store is not an encrypted vault. Route drafts use session storage. AI requests happen on explicit actions; provider keys are sent only to fixed provider endpoints. Postal lookup and hub suggestions use the saved Groq key. Never commit browser profiles, real orders or credentials.

## Development and versioning

- `main`: stable, approved code. Initial publication is version `1.5.0`.
- `feature/<topic>`: new features and refactoring.
- `fix/<topic>`: bug fixes.
- Use Conventional Commits, for example `feat(hubs): add search-area toggle`.
- Every release updates `manifest.json`, `CHANGELOG.md`, and has an annotated `vX.Y.Z` tag.
- **Do not merge into `main` without the owner's explicit approval.**

See [AGENTS.md](AGENTS.md), [architecture](docs/ARCHITECTURE.md), [release process](docs/RELEASING.md), and [changelog](CHANGELOG.md).

## Tests

Run unit tests with Node.js:

```sh
node --test tests/*.test.cjs
```

Browser tests in `tests/*.browser.cjs` use Playwright and fake API responses. The original snapshot uses a local Chrome path; portable test tooling is being prepared on the modularization feature branch. Live model quality is not proven by mocked browser tests.

## Legacy notes

[INSTALACJA.md](INSTALACJA.md) contains the original Polish installation/version notes. [TEST-KODOW.md](TEST-KODOW.md) records the exploratory postal-code experiment. They are preserved as historical documents; current development guidance is in the English docs.

No public/open-source license is granted by this repository.
