# GitHub setup status

- Repository: https://github.com/natandomnik/Trasa-do-Maps
- Visibility: private.
- Default/stable branch: main.
- Initial stable tag/release: v1.5.0.
- Auto-merge: disabled. Squash merging is available; merge commits/rebase merge are disabled in repository settings.
- Feature organization is proposed on feature/modular-structure, not merged into main.

## Protection limitation

On 2026-10-23, GitHub rejected the request to protect main with HTTP 403: “Upgrade to GitHub Pro or make this repository public to enable this feature.” The repository was kept private. Therefore required PR/status checks and force-push/deletion protection are NOT server-enforced on main. AGENTS.md and the release process require explicit owner approval before any merge; these instructions do not replace GitHub access controls.

If the account is upgraded, enable protection for main: require a pull request, require the CI `test` check on up-to-date branches, enforce for administrators, disable force pushes and deletion. Do not enable auto-merge. A sole-owner repository may allow zero additional reviewer approvals while still requiring the owner's explicit approval in the development workflow.
