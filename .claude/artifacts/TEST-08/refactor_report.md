# Refactor report: TEST-08

Gate result: 1 improvements applied (10 files examined)

Scope: the changed set in review_scope.md (AppFooter.tsx and its test, api/version.ts and its test, api/baseUrl.ts, api/notes.ts, LandingPage.test.tsx, e2e/helpers/backendVersion.ts, the TEST-08 and TEST-04 footer specs).

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | `unknown`, empty-string and rejected tests asserted before the mock's promise settled, so `/^Task Notes$/` matched the initial state and would pass without the filter (self-review RECOMMENDED) | Dead code / test validity | RECOMMENDED | Flush the promise chain in `renderFooter` with `await act(async () => {})`; drop the now-redundant `toHaveReturnedTimes` wait. Applied. |

Verify by running: with `&& version !== UNKNOWN_VERSION` temporarily removed from AppFooter.tsx, the `unknown` test fails (1 failed, 5 passed); line restored, all 6 pass.

No other findings across the examined files. No file created.
