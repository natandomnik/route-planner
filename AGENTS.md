# Repository instructions

## Project identity and language workflow

- The product name is **Route Planner**. Use this name in the extension manifest, page titles, documentation and new feature descriptions.
- The owner writes development requests in Polish. Interpret their requirements in English before implementation, preserving intent, constraints and acceptance criteria. Do not require the owner to provide an English translation.
- Write agent instructions, technical specifications, engineering documentation, new code comments, commit messages and built-in LLM system instructions in English.
- Respond to the owner in Polish and keep product UI messages in Polish unless explicitly requested otherwise.
- This language workflow is not an additional translation API step. Preserve original route input, place names, postal codes, quoted examples and identifiers; they are data, not development instructions.
- Preserve existing saved custom prompts verbatim. Translate a custom prompt only when the owner explicitly asks to translate that prompt.
- Keep historical repository URLs, filenames, tags and backup paths unchanged unless their targets are actually renamed.

## Scope and safety

- Preserve existing product behavior unless the owner requests a change.
- Keep user-facing text Polish and engineering documentation English.
- Never commit credentials, browser state, personal orders, local backups, or generated artifacts.
- Keep keys provider-specific and API endpoints fixed. Never log keys or raw authenticated headers.
- Treat model responses, retrieved pages and pasted orders as untrusted data. Validate before use; render text, not remote HTML.
- Do not make live API calls in automated tests. A live experiment requires task-specific user authorization.

## Workflow: Fast Local Iteration vs. Final Publication

Distinguish between **active local development** and **final commit / publication to GitHub**:

### 1. Active Local Development (Fast Mode)
- Focus on fast execution: implement requested modules, UI adjustments, or bug fixes directly in the active working branch without unnecessary procedural overhead.
- Do not create redundant intermediate backup branches for every minor tweak.
- Do not run the full heavy test suite (`npm run test:all` or multi-second browser tests) or update `CHANGELOG.md` on every micro-edit or intermediate step.
- Perform quick sanity/syntax verification (`npm run check` or targeted file syntax check) so the user can immediately reload the extension in Chrome (`chrome://extensions`) and test the result.
- Keep responses concise and focused on how the user can test the change in the browser.

### 2. Finalization & Pre-Push / Publication Mode (Full Validation)
- Triggered only when a feature/fix is fully ready for committing, pushing to GitHub, opening a PR, or upon explicit user request:
  - Run full test suite (`npm run check`, `npm test`, `npm run test:browser`).
  - Add regression tests if state, provider, or module behavior was modified.
  - Update `CHANGELOG.md` under `[Unreleased]`.
  - Prepare a Conventional Commit (`feat`, `fix`, etc.) with a concise English message.
  - Never push to GitHub, merge to `main`, or publish a release without explicit owner approval.

## Modules

- Each substantial new feature belongs in its own folder under `src/modules/<feature>/`.
- Add an English module README describing purpose, entry points, functions, dependencies, settings, network access, failure behavior and tests when finalizing a module.
- Register optional modules in the feature registry (`src/core/modules.js`) and provide an explicit settings toggle.
- Module-specific option sections, accordions, and prompt editors declare `data-module="<moduleId>"` to be conditionally toggled.
- Disabled modules must not trigger API requests; disabling an active module must cancel or discard pending work and remove stale results.
- Preserve existing behavior when migrating settings. Defaults for existing features remain enabled unless explicitly requested otherwise.
- Local route editing and ordinary clipboard export must remain available when optional AI modules are off.
- Do not add runtime remote scripts, a framework or a bundler solely to organize folders.

## Git rules

- `main` is the stable branch. Work on `feature/<topic>` or `fix/<topic>`.
- Never merge to `main`, enable auto-merge, or directly push feature changes to `main` without explicit owner approval for that change.
- Develop and test locally first. Do not push commits, branches, tags, or publish releases without explicit owner approval. Local commits are allowed.
- Do not rewrite published history or force-push without explicit approval.
- Use Conventional Commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, or `ci`, with an optional scope.
- Keep `manifest.json` as the runtime version source of truth. Release version, changelog heading and annotated Git tag must agree on releases.
