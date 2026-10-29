# Refactor report: TEST-10

Run: deliver-20261029T181219Z

## Gate result

no findings (2 files examined)

Files examined: frontend/src/api/version.ts, frontend/src/components/AppFooter.tsx. No code was changed, so the suites were not re-run.

## Mandatory input: self-review RECOMMENDED finding

Finding: the existing TEST-08 E2E spec (e2e/tests/TEST-08_footer_app_version.spec.ts:11) asserts the exact footer text `Task Notes v${backendVersion}`, which fails when BUILD_COMMIT is set because the footer then appends ` (xxxxxxx)`.

Verify-run: `playwright test e2e/tests/TEST-08_footer_app_version.spec.ts` with the backend (port 8010) and Vite frontend (port 5183) up from the TEST-10 worktree and BUILD_COMMIT unset (the backend reported commit "unknown"). Result: 2 passed / 0 failed.

Disposition: declined, no change made. The spec passes in the configuration the finding names, because an unset BUILD_COMMIT yields "unknown", which the client normalises to null, so no commit span renders. Changing the TEST-08 assertion is beyond this item's planned files. Residual risk: with BUILD_COMMIT set, the exact-text assertion on app-footer would fail; recorded here for the PR as a known fragility.
