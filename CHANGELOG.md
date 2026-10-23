# Changelog

Versions follow semantic versioning. Dates use Europe/Warsaw. Commit messages follow Conventional Commits.

## [Unreleased]

No changes since the initial stable import.

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

Original notes are preserved in INSTALACJA.md. Earlier archives remain outside the repository.
