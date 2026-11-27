# Refactor report: TEST-08

Result: 1 improvements applied (14 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Wrong ports (5173, 8000) contradict the project's 5183 and 8010 (review RECOMMENDED 1) | Naming consistency | RECOMMENDED | Applied: 5173 to 5183, 8000 to 8010 (text only) |
| 2 | frontend/src/api/version.test.ts | Test title says "default base URL" but only asserts the path suffix | Naming consistency | OPTIONAL | Declined: the plan's Criterion coverage table names this title as a test id, so a rename would fail the push gate |

Examined all 14 changed files against the checklist: no dead code, DRY, complexity, layering or import findings beyond the above.
Known and left alone: TEST-01 and TEST-03 UAT scripts and scenarios carry the same stale 5173/8000 ports; they belong to other work items and are outside this diff.
Files created: none.
