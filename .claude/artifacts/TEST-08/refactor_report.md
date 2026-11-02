# Refactor report: TEST-08

Gate result: 1 improvements applied (10 files examined)

Scope: the feature's changed files named in the handover manifest (10 source, test and E2E files). Mandatory input: the self-review's two RECOMMENDED findings.

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Rejected-path and unknown-path tests asserted after `await Promise.resolve()`, which does not reliably wait for the then/catch chain to settle, so a broken failure path could pass | Review finding (test reliability) | RECOMMENDED | Applied: `settlePendingPromises()` helper (`await act(async () => {})`) replaces the bare `await Promise.resolve()` in both tests |
| 2 | e2e/tests/TEST-08_footer_app_version.spec.ts, e2e/tests/TEST-04_page_footer.spec.ts | Specs had never executed (no Playwright browser); criterion 1's only covering tier is E2E | Review finding (unexecuted tier) | RECOMMENDED | Discharged by running, no code change: installed chromium for the project's pinned Playwright, started backend (8010) and frontend (5183), ran both specs: 7 passed, 0 failed. Servers stopped |

## Verification

- Finding 1, mutation check: with the `.catch` body temporarily set to `setVersion("undefined")`, the rejected-path test failed (`Received: Task Notes vundefined`); 4 others passed. Source restored, no diff against HEAD.
- Finding 2: `playwright test` on the two specs, 7 passed (4.1s).
- Frontend suite after the change: 6 files, 33 tests passed.

## Files created

None.

## Declined

None. No other finding under the Section 3 checklist in the 10 examined files.
