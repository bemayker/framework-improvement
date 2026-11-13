# Refactor report: TEST-08

Result: 1 improvements applied (10 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | "fails" and "unknown version" tests asserted after `waitFor(mock called)`, which passes on mount, before the result is applied | Test quality (reviewer RECOMMENDED) | RECOMMENDED | Applied: `await act(async () => {})` after render, then assert. |

Verify-by-running: with the `.catch` handler temporarily set to `setBackendVersion("x")`, the "fails" test failed (`expected 'Task Notes vx' to be 'Task Notes'`). Mutation reverted before commit.

OPTIONAL (not applied, goes to PR body): frontend/src/api/notes.ts line 9, move the `API_BASE_URL` import to the top of the file.
