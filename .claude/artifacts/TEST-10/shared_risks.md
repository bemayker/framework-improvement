# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` resolves `{ version, commit }`; the `"unknown"`, blank, missing or non-string commit becomes `null`
- frontend/src/api/version.test.ts: assertions updated to the new shape; commit-normalization cases added
- frontend/src/components/AppFooter.tsx: renders the first 7 characters of the commit next to the version
- frontend/src/components/AppFooter.test.tsx: mock updated to the new shape; commit success and unknown-commit tests added
- frontend/src/components/LandingPage.test.tsx: only the `fetchBackendVersion` mock's resolved value changes to `{ version, commit }`

frontend/src/components/LandingPage.tsx is NOT modified.

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx (with their tests) may also be modified by CHORE-02 (independent, TEST-08 follow-up: a fetch timeout in version.ts); serialize if run concurrently.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, double-submit fix on the note form, currently in build) if its fix reaches the LandingPage submit wiring; per the dispatch BUG-04 touches frontend/src/components/NoteForm.tsx and NoteForm.test.tsx only, which TEST-10 does not touch. The map's LandingPage.tsx warning does not apply: TEST-10 does not edit LandingPage.tsx.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, footer build note); serialize if run concurrently.
- e2e/tests/TEST-08_footer_app_version.spec.ts (not modified) asserts the exact footer text `Task Notes v{version}` against the real backend. It stays green only while the E2E backend runs with `BUILD_COMMIT` unset (commit `"unknown"`, so no commit is rendered), which holds today: docker-compose.yml passes `${BUILD_COMMIT:-}` and no CI workflow sets it. A later item that sets `BUILD_COMMIT` in the E2E environment must update that assertion.
