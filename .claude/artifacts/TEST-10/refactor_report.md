# Refactor report: TEST-10

Result: 1 improvements applied (7 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Rejection and null-version tests asserted after only toHaveBeenCalled(), true on mount, so they could not tell the failure path from the pending path | Review RECOMMENDED 1 | RECOMMENDED | Settle with `await act(async () => {})` before asserting; drop unused waitFor import |
| 2 | e2e/tests/TEST-08_footer_app_version.spec.ts, e2e/tests/TEST-10_footer_build_commit.spec.ts | isVersionApiUrl and VERSION_PATH duplicated | DRY violations | OPTIONAL | Not applied: needs a new e2e/helpers file, outside the gate's mandate for a non-RECOMMENDED item |

Verify by running: with the .catch temporarily calling setBackendVersion({ version: "ERR", commit: null }), the rejection test failed ("expected 'Task Notes vERR' to be 'Task Notes'"). Mutation reverted, not committed. Frontend tier after the change: 45 passed, 0 failed.

No new source or test file added.
