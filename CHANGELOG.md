# Changelog

Versions follow semantic versioning. Dates use Europe/Warsaw. Commit messages follow Conventional Commits.

## [Unreleased]

## [1.7.1] - 2026-10-26

### Changed

- Published the existing English default route-extraction instruction, retaining the JSON contract, Polish warnings, multi-stop examples and incomplete-postcode handling.
- Published the existing revised A/B suggestion instruction: infer the anchor country from route context when necessary, prioritize geographical knowledge with limited search, and aim for seven distinct search areas within 10–115 km.
- Preserved the complete modular project structure and all existing implementation files without further runtime edits.

### Validation

- 48 unit tests and five browser suites passed with mocked provider responses.
- Geographic accuracy, source validity and live provider availability were not tested. The revised hub prompt allows inferred locations and model knowledge; suggestions remain estimates.
- Saved custom extraction prompts remain in use and are not overwritten by the updated default.

## [1.7.0] - 2026-10-23

### Added

- Masked API key preview (`#saved-key-preview`) below the key input in options, showing the start and end of the saved key with status indication for saved vs unsaved modifications.
- Multi-provider support for endpoint hub suggestions (`hubSuggestions`): models from Google Gemini, OpenAI, Groq and OpenRouter can now be used for A/B endpoint suggestions.
- Dynamic `#hub-model` dropdown displaying available models for providers with configured API keys.
- Module settings details presented as collapsible accordions (`<details>`) for each module option under `Moduły`.
- Declarative `data-module="<moduleId>"` binding in options for module-dependent option sections, prompt accordions and external links (`postalLab`, `hubSuggestions`, `aiExtraction`, `postalLookup`).

### Changed

- Settings UI dynamically toggles module prompt accordions and configuration fields immediately when a module is enabled or disabled, keeping disabled modules' prompt editors and controls hidden.
- Moved the provider key generation link directly below the API key input field for immediate access.
- Styled the provider key deletion action as a danger button with red accent.

### Fixed

- Provider profile isolation when switching providers in options: prevented previous provider model IDs from leaking into the newly selected provider's profile or forcing dropdowns to "custom".
- Independent API key isolation per provider profile, preventing keys from being cross-contaminated or shared between providers during UI interactions.

## [1.6.0] - 2026-10-23

### Added

- Independent, persistent settings toggles for AI extraction, clipboard postal lookup, endpoint hub suggestions and the postal experiment; all existing defaults stay enabled.
- English per-module documentation, module development contract and complete source/function map.
- Locked development dependencies, portable browser tests and GitHub Actions CI.

### Changed

- Organized source under `src/core`, `src/ui`, and `src/modules`, and styles under `assets/styles`.
- Preserved root extension page URLs and existing default behavior.
- Moved original Polish notes unchanged into `docs/legacy`.

Approved modular structure release; browser storage mocks persist independently of document navigation.

## [1.5.0] - 2026-10-23

### Added

- First Git-managed snapshot, preserving the existing manifest version 1.5.0.
- Endpoint A/B search-area suggestions with compact chips and a separate Groq 20B/120B model setting.
- English repository guidance, release workflow, file/function map, and secret/artifact exclusions.

### Validation

- 44 unit tests and browser checks for route editing, clipboard enrichment and endpoint suggestions passed before import.
- Browser checks use simulated provider responses; geographic accuracy is not guaranteed.

### Existing functionality retained

- Local-first route parsing and explicit multi-provider AI extraction.
- Persistent custom AI prompt and provider connection checks.
- Drag-and-drop editing and current-tab Google Maps opening.
- Plain multiline clipboard export, postal lookup and busy spinner.

## Earlier local versions (before Git)

The following history is reconstructed from existing project notes, not historical Git commits or releases:

- **1.4.8**: clipboard activity spinner.
- **1.4.7**: postal lookup on copy; plain address lines.
- **1.4.6**: isolated postal-code research experiment.
- **1.4.5–1.4.4**: clipboard formatting iterations.
- **1.4.3**: clipboard button; alternative map links removed.
- **1.4.2**: improved handling of partial postcodes with city names.
- **1.4.1**: selected model shown in the popup.
- **1.4.0**: editable, persistent custom AI instruction.

Original notes are preserved in docs/legacy/INSTALACJA.md. Earlier archives remain outside the repository.
