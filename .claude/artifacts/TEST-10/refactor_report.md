# Refactor report: TEST-10

Gate result: 2 improvements applied (9 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/tests/TEST-10_footer_build_commit.spec.ts | `isVersionApiRequest` never called; `Request` import only served it (review RECOMMENDED 1) | Dead code | RECOMMENDED | Deleted the helper and the `Request` import; folded its rationale into the route helper's docstring |
| 2 | frontend/src/components/AppFooter.test.tsx | Test `renders no commit when the backend reports no version` asserted before the resolved value reached state (review RECOMMENDED 2) | Dead code (vacuous assertion) | RECOMMENDED | Settle with `await act(async () => {})`; verified it fails with the guard on AppFooter.tsx line 36 removed |

Files examined: the 8 attributed source, test and UAT files plus `LandingPage.test.tsx` and the UAT script copy, with no further findings.

Declined: none. The OPTIONAL finding on the criterion 2 Gherkin scenario is left for the PR body.
