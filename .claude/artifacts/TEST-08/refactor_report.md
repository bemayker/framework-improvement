# Refactor report: TEST-08

Gate result: 1 improvements applied (8 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/api/version.test.ts | URL test asserted the hardcoded default, not the resolution (review RECOMMENDED 1) | Naming consistency / test accuracy | RECOMMENDED | Applied: import `API_BASE_URL` from `./baseUrl` and assert `${API_BASE_URL}/api/version` |
| 2 | frontend/src/components/AppFooter.test.tsx | Failure-path tests may pass before the `.catch` runs (review RECOMMENDED 2) | Test accuracy | RECOMMENDED | Declined: Verify line run and both failure tests failed under the mutation (see below); no change |

## Finding 2: declined, with evidence

Ran `npm --prefix .claude/worktrees/TEST-08/frontend exec --no -- vitest run --root .claude/worktrees/TEST-08/frontend src/components/AppFooter.test.tsx` with `AppFooter.tsx` line 26 temporarily changed to `.catch(() => setVersion("unknown"))`. Result: 2 failed, 4 passed. Both failure-path tests failed ("renders only the app name when the version request fails" and "renders only the app name for the unresolved sentinel rejection", received `Task Notes vunknown`). The waits in those tests are enough to observe the rejection handler, so the regression is caught. Line 26 was restored.

No other files in scope had checklist findings (naming, DRY, dead code, complexity, layering, imports, structure). No file was created.
