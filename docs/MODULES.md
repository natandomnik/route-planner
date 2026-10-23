# Adding a feature module

1. Create `src/modules/<feature>/` with a service/controller and English README. Keep domain logic independent from the route editor where practical.
2. Register a stable camelCase key in `src/core/modules.js`. Decide the default explicitly. Existing modules default to on so migration preserves behavior; do not automatically enable a new network feature without reviewing its product requirements.
3. The settings screen renders the registry and saves booleans under `routeSettings.modules`. Keep keys, custom prompts and unrelated flags during all writes, including key deletion.
4. Gate every entry path, including keyboard shortcuts, direct page URLs and service calls where settings are available. Hiding a button alone is not enough.
5. Cancel/discard in-flight work on disable, route edit, provider/settings change or page disposal. Never apply results for an old snapshot.
6. Document data sent, provider/key ownership, permissions, timeout, fallback, and tests. Use fixed provider endpoints and text-only rendering of remote content.
7. Add tests for enabled behavior, default migration, disabled no-network behavior, persistence and stale results.
8. Add script paths to the relevant root page in dependency order. Run `npm run test:all` and update architecture/changelog.
9. Open a feature PR. Do not merge into main without explicit owner approval.

## Current keys

| Key | Folder | Disabled behavior |
| --- | --- | --- |
| aiExtraction | ai-extraction | No extraction request; local parsing remains |
| postalLookup | postal-lookup | Copy existing points, without postal research |
| hubSuggestions | hub-suggestions | Hide compass controls/results; discard active searches |
| postalLab | postal-lab | Hide experiment link; reject direct test execution |

Module disable is a feature-level guarantee, not a network sandbox. The explicit postal experiment and postal lookup share a research service but have independent toggles. Global local-only mode still controls production AI use; the isolated experiment remains an explicit diagnostic action as before.
