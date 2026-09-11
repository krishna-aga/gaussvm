# Development conventions

Local author: Krishna. Remote: `https://github.com/krishna-aga/gaussvm.git`. Keep commits local until the owner asks to push. Do not change global Git identity or publish using another account.

- Commit coherent, reviewable changes. Dependency lockfiles may be larger than source edits. Never fabricate dates or manufacture activity.
- Preserve existing work and history; do not amend/squash just to improve submission appearance.
- Pin upstream contracts and compare ABI, dispatch, settlement and license changes on upgrades.
- Keep local/testnet and free-infrastructure boundaries.
- Math changes require independent reference and boundary tests; never relax tolerances merely to hide failures.
- Confirm transactions from receipts. Unknown status is not failure evidence.
- Keep illustrations separate from executable quotes and measured evidence.
- Run `npm run check`, relevant browser tests and `git diff --check` before committing behavior changes. Report only checks that ran.

Generated artifacts, logs, secrets and local manifests are ignored. Public Sepolia manifests may be committed after verifying their addresses and receipts.
