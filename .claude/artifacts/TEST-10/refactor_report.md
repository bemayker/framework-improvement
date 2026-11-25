# Refactor report: TEST-10

Gate result: 2 improvements applied (10 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/api/version.ts | `toShortCommit` compared the commit to `UNKNOWN_VERSION`, whose comment calls it the version's sentinel | Naming consistency | RECOMMENDED | Added `UNKNOWN_COMMIT` naming the backend's commit sentinel and used it in `toShortCommit` (applied) |
| 2 | e2e/uat/scenarios/TEST-10_footer_build_commit.feature | The pending scenario expected " v0.1.0 (0123456)" but no step set the commit up | Dead code (unsupported expectation) | RECOMMENDED | Added the "backend reports the commit" Given step (applied) |

## Declined

- Manual UAT script (both copies, identical): no matching gap. Step 4 runs after the environment setup started the stack with `BUILD_COMMIT=0123456789abcdef` and steps 1 to 3 verified that commit, so the expected `Task Notes v0.1.0 (0123456)` is set up. No change.
