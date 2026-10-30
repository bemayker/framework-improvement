# Refactor report: TEST-10

Result: 2 improvements applied (11 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/tests/TEST-10_footer_build_commit.spec.ts | Live backend serves "unknown" (7 chars) locally and in compose CI, so E2E never checked the 7-character cut (review RECOMMENDED 1) | Review finding | RECOMMENDED | Added a stubbed-response case: commit "abcdef1234567" must render "Task Notes v9.9.9 (abcdef1)" and app-commit "abcdef1". Existing specs kept. No file created. |
| 2 | e2e/uat/scenarios/TEST-10_footer_build_commit.feature | Pending and recovery scenarios expected "abc1234" with no Given setting BUILD_COMMIT (review RECOMMENDED 2) | Review finding | RECOMMENDED | Added `Given the backend was built with BUILD_COMMIT "abc1234def5678"` to both scenarios. |

## Declined
- OPTIONAL (spec cast hides a missing commit): informational, not applied by this gate.

## Checklist pass over the other changed source files
AppFooter.tsx, version.ts, their tests and the TEST-08 spec: no naming, DRY, dead-code, complexity, layering, import or structure findings.

## Tests after the changes
- frontend vitest: 46 passed, 0 failed
- E2E smoke (TEST-10, TEST-08, TEST-04 specs): 9 passed, 0 failed
