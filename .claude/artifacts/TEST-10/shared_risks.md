# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: getVersion returns { version, commit }; adds UNKNOWN_BACKEND_COMMIT
- frontend/src/api/version.test.ts: assertions for the object shape and null-commit cases
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: mocks the object shape; adds commit tests
- frontend/src/components/LandingPage.test.tsx: the getVersion mock resolves the object shape (test-only)
- e2e/tests/TEST-08_footer_app_version.spec.ts: footer assertion loosened to toContainText

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; its note-form double-submit fix plausibly adds a LandingPage test). TEST-10 changes only the version mock in that file and does NOT modify frontend/src/components/LandingPage.tsx, so the map's LandingPage.tsx warning does not apply to this plan; the overlap is the test file only.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts, frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, plausibly a fetch timeout in version.ts)
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, could run concurrently; footer build note)
