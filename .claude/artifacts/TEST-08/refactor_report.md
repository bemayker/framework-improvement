# Refactor report: TEST-08

Result: 4 improvements applied (12 files examined)

| # | File | Finding | Category | Severity | Disposition |
| - | ---- | ------- | -------- | -------- | ----------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Absent-version assertions ran before the rejected/null promise settled | Test correctness (review RECOMMENDED 1) | RECOMMENDED | Applied: `await act(async () => {})` before assertions. Verified: with the catch handler mutated to set "unknown", the rejected-request test fails; line restored. |
| 2 | e2e/tests/TEST-08_footer_app_version.spec.ts | Failure spec asserted before the aborted request settled | Test correctness (review RECOMMENDED 1) | RECOMMENDED | Applied: wait for `requestfailed` on the version URL first. Not run (needs the live stack). |
| 3 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Stale ports 5173 and 8000 vs compose 5183 and 8010 | Naming consistency (review RECOMMENDED 2) | RECOMMENDED | Applied |
| 4 | frontend/src/api/notes.ts | Import placed after the Note type | Import hygiene (review OPTIONAL 2) | OPTIONAL | Applied (trivial) |

Declined: none. OPTIONAL 1 (e2e/helpers/backendVersion.ts not in manifest): no code change, to be named in the PR body.
Files created: none.
