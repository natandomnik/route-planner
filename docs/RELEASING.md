# Branches and releases

1. Start from the approved `main`: `git switch main && git pull --ff-only`.
2. Create `feature/<topic>` or `fix/<topic>`. Keep unrelated work separate.
3. Implement and document the change. Use Conventional Commits.
4. Run unit and browser tests. No real API keys in tests or CI.
5. Update the Unreleased changelog section and open a reviewable PR.
6. Wait for explicit owner approval before merging. A passing CI run is not approval.
7. For an approved release, select a semantic version, update manifest/changelog, and validate the release commit.
8. After the owner-approved merge, create an annotated `vX.Y.Z` tag on the stable commit and push that tag. Never move an existing release tag.

The initial import is tagged `v1.5.0`; no older Git history is fabricated. Structural/module work after import remains Unreleased on its feature branch until approved.

## Rollback

Prefer a reviewed revert commit for published changes. To temporarily run the previous release, use a separate checkout of its tag. Do not reset/force-push main. Back up local browser settings before changing the loaded extension path; API keys are not in Git.

## Enforcement

AGENTS.md and PR review document the owner's no-merge rule. Configure GitHub branch protection/rulesets when the account plan permits private-repository protection. If server-side protection is unavailable, state that limitation explicitly; documentation is not a technical access control.
