# Changelog

Versions follow semantic versioning. Dates use Europe/Warsaw. Commit messages follow Conventional Commits.

## [Unreleased]

## [1.8.2] - 2026-10-29

### Changed

- Restore the final product name Route Planner and the `route-planner` package/download names at the owner's request.
- Consolidate all 1.8.x map, corridor, history, offline demo and TimoCom improvements into `main` through the approved pull request.
- Preserve existing settings, history, internal identifiers and historical release tags.

### Validation

- Extension syntax/assets, 63 unit tests and nine mocked browser suites passed. No live provider calls were made.

## [1.8.1] - 2026-10-29

### Changed

- Rename the extension to Road Planner in the manifest, toolbar, planner header, page titles, TimoCom action and current engineering documentation.
- Rename the development package and downloadable ZIP/checksum assets to `road-planner`.
- Preserve existing settings, IndexedDB history, internal message identifiers, historical releases and repository URLs for compatibility.

### Validation

- Extension syntax/assets, 63 unit tests and nine mocked browser suites passed. No live provider requests were used.

## [1.8.0] - 2026-10-29

### Added

- Optional TimoCom integration: compact Route Planner and Google Maps buttons below the offer map, with new-tab arrows, hover styles and responsive wrapping. Import country/postcode/locality fields directly into ordered editable route points, scoped to the current offer and refreshed after SPA changes.
- Optional Leaflet map panel with Geoapify geocoding and driving routes, visible once at least two route points are recognized. Display road distance above the fields and in a prominent blue map badge.
- Local map context: Natural Earth borders and major cities, 44 logistics-town references and 47 truck-parking references, with zoom thresholds, label collision avoidance and viewport limits. These are static orientation data, not live vehicle or parking availability.
- Corridor search strategy alongside radius search, with up to eight pickup-area and six delivery-area suggestions. Prioritize short upstream/lateral approaches, sensible cross-border access and reduced backtracking.
- Offline demo provider for extraction and strategy-specific suggestion previews without provider API calls.
- Optional local raw-input history captured only on explicit AI recognition, including offline demos. Provide review, redaction, deletion, clipboard export and JSON export through settings, plus a separate synthetic starter corpus for future parser regression work.

### Changed

- Use a two-button radius/corridor selector. A corridor action requests suggestions for both endpoints.
- Compact suggestion chips support address copying without layout shifts and an independent distance-arrow link to the relevant Google Maps segment.
- Keep existing map layers and viewport when additional suggestions arrive; append new points without reloading the map.
- Render the main driving route in blue, suggestion points/roads in red and hovered suggestions in green, with prominent A/B markers and hover-only endpoint labels.
- Improve compact empty-state layout, route input spacing, sticky route-opening actions, map tooltips and route-specific browser tab titles.
- Remove redundant counters, strategy captions and history controls from the main planner. History exports contain source text and metadata, not generated AI answers.
- Keep product text Polish while translating remaining parser comments and historical engineering instructions into English.

### Fixed

- Normalize geocoding inputs into separate country, postcode and city parameters; handle postal-only inputs, spaced national formats, trailing postcodes and partial freight region prefixes.
- Reject wrong-country, mismatched or ambiguous geocoding results and ignore older coordinate caches. Retry unsuccessful structured lookups as free text under the same validation constraints.
- Correct map zoom behavior and preserve chip widths during copy feedback.

### Validation and limitations

- Extension syntax/assets, 63 unit tests and nine mocked browser suites passed before publication. No live provider calls, real credentials or private route histories are included in the release.
- TimoCom integration is tested against synthetic markup matching the supplied DOM contract; authenticated live-site behavior has not been independently verified.
- Geoapify routes use driving mode and do not validate truck restrictions. LLM search-area distances remain estimates; model suggestions and static parking data do not indicate available drivers.

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

Historical notes are available in English in docs/legacy/INSTALACJA.md; the original Polish text remains in Git history. Earlier archives remain outside the repository.
