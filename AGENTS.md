# Repository instructions

## Scope and safety

- Preserve existing product behavior unless the owner requests a change.
- Keep user-facing text Polish and engineering documentation English.
- Never commit credentials, browser state, personal orders, local backups, or generated artifacts.
- Keep keys provider-specific and API endpoints fixed. Never log keys or raw authenticated headers.
- Treat model responses, retrieved pages and pasted orders as untrusted data. Validate before use; render text, not remote HTML.
- Do not make live API calls in automated tests. A live experiment requires task-specific user authorization.

## Git workflow

- `main` is the stable branch. Work on `feature/<topic>` or `fix/<topic>`.
- Never merge to `main`, enable auto-merge, or directly push feature changes to `main` without explicit owner approval for that change.
- The initial repository bootstrap and initial stable import are authorized by the repository setup request; this is not permission for later merges.
- Develop and test locally first. Do not push commits, branches, tags, or publish releases without explicit owner approval. Local commits are allowed.
- Do not rewrite published history or force-push without explicit approval.
- Use Conventional Commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, or `ci`, with an optional scope.
- Prepare reviewable commits/PRs with a concrete behavior summary, validation and known limitations.

## Modules

- Each substantial new feature belongs in its own folder under `src/modules/<feature>/`.
- Add an English module README describing purpose, entry points, functions, dependencies, settings, network access, failure behavior and tests.
- Register optional modules in the feature registry and provide an explicit settings toggle.
- Disabled modules must not trigger API requests; disabling an active module must cancel or discard pending work and remove stale results.
- Preserve existing behavior when migrating settings. Defaults for existing features remain enabled unless explicitly requested otherwise.
- Local route editing and ordinary clipboard export must remain available when optional AI modules are off.
- Do not add runtime remote scripts, a framework or a bundler solely to organize folders.

## Validation and releases

- Run relevant unit/browser tests; document what was tested and whether API responses were mocked.
- Verify manifest paths and script loading after moving files.
- Add meaningful regression tests for state changes, cancellation, provider isolation and settings migrations.
- Add an Unreleased changelog entry for user-visible or structural changes.
- Keep `manifest.json` as the runtime version source of truth. Release version, changelog heading and annotated Git tag must agree.
- Do not publish a release or tag unapproved work as stable. Follow `docs/RELEASING.md`.
