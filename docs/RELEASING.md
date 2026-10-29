# Branches and releases

## Workflow modes

- **Local iteration**: During active development, quick syntax and manifest checks (`npm run check`) are sufficient so the owner can immediately test changes in the browser. Full test suites, changelog entries, and release commits can be deferred until work on a feature is complete.
- **Commit and release**: Before pushing to remote, merging, or releasing, follow the full release procedure below.

## Release procedure

1. Start from the approved `main`: `git switch main && git pull --ff-only`.
2. Create `feature/<topic>` or `fix/<topic>`. Keep unrelated work separate.
3. Implement and document the change. Use Conventional Commits.
4. Run full unit and browser tests (`npm run test:all`). No real API keys in tests or CI.
5. Update the Unreleased changelog section. Test locally and wait for explicit owner approval before pushing or opening a PR.
6. Wait for explicit owner approval before merging. A passing CI run is not approval.
7. For an approved release, select a semantic version, update manifest/changelog, and validate the release commit.
8. After the owner-approved merge, create an annotated `vX.Y.Z` tag on the stable commit and push that tag. Never move an existing release tag.

The initial import is tagged `v1.5.0`; no older Git history is fabricated. The owner-approved modular structure is released as v1.6.0.

## Rollback

Prefer a reviewed revert commit for published changes. To temporarily run the previous release, use a separate checkout of its tag. Do not reset/force-push main. Back up local browser settings before changing the loaded extension path; API keys are not in Git.

## Enforcement

AGENTS.md and PR review document the owner's no-merge rule. Configure GitHub branch protection/rulesets when the account plan permits private-repository protection. If server-side protection is unavailable, state that limitation explicitly; documentation is not a technical access control.


## Downloadable package

Run `python3 scripts/package-release.py` after validation. It builds `dist/road-planner-X.Y.Z.zip` and a SHA-256 checksum from an explicit runtime-file allow-list. The archive has `manifest.json` at its root; users extract it and choose **Load unpacked** in Chrome. Do not distribute `node_modules`, tests, credentials, browser state or real history exports. Upload both ZIP and checksum to the GitHub release.

When the owner authorizes publication without authorizing a merge, tag the validated feature-branch commit and attach the package to that release. This does not authorize changing `main`; state the release branch in the release notes. Never move an existing tag.
