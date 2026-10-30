# Refactor report: TEST-08

Result: 2 improvements applied (13 files examined; scope: the feature's changed files from review_scope.md, excluding the `.claude/artifacts` UAT script and the three Markdown/Gherkin artifacts)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/tests/TEST-08_footer_app_version.spec.ts | Aborted-request test asserted `toHaveText("Task Notes")` and `toHaveCount(0)`, both true while the request is still in flight, so it passed whether or not the rejection path ran (self-review RECOMMENDED, mandatory input) | Test correctness | RECOMMENDED | Register `page.waitForEvent("requestfailed")` for `/api/version` before `goto` and await it before the assertions. Applied. |
| 2 | frontend/src/api/notes.ts | `import` placed after the `Note` type export | Import hygiene | RECOMMENDED | Moved the import above the type. Applied. |

Files created: none.

Tests after the changes: frontend vitest 40 passed; E2E smoke (TEST-08 and TEST-04 specs) 6 passed.

Declined: none. OPTIONAL from the self-review (docs/DEVELOPMENT.md line 667 edited by the docs check, accurate) goes to known improvements, not this gate.
