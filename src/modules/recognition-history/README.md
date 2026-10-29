# Recognition input history

Optional `recognitionHistory` module, enabled by default. Only an explicit AI recognition action captures the text from the main textarea, including offline-provider clicks. Local parsing, route edits, map requests and generated AI responses do not add history data. A record contains the original text, timestamp, generated ID and capture trigger. The history store is per-browser-profile IndexedDB, limited to the newest 500 records.

The main planner has no history/confirmation controls. Settings link to `history.html`, where users can review, redact, delete, copy or export source texts. The UI and export use no AI outputs, local-parser results or confirmation fields, including for older records. Existing legacy database fields are preserved but not displayed or exported. `update` only accepts text changes. Deleting a record cannot be undone by a pending update.

Keys, authenticated headers and model prompts are not stored. Raw user text can contain personal or commercial data; review/redact it before sharing. Export files are ignored by Git. Disabling the module stops collection and preserves existing records for management. No remote service is used by this module.

`examples.json` is a separate synthetic starter corpus with proposed parser expectations; it is not real history or verified training data. Improvement workflow: export raw examples, review intended routes, then write parser rules and regression cases. This feature does not train or alter parsing code automatically.

Validation: `tests/history.browser.cjs` checks raw-only capture, disabled collection, ignored result fields, redaction and deletion with local IndexedDB. No live APIs.
