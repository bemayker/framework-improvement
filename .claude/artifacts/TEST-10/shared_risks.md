# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion()` returns the response object with an optional `commit`
- frontend/src/api/version.test.ts: tests for the object return and the commit field
- frontend/src/components/AppFooter.tsx: short-commit span after the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and sentinel commit paths
- frontend/src/components/LandingPage.test.tsx: `getBackendVersion` mock resolves an object; footer assertion includes the commit
- e2e/tests/TEST-08_footer_app_version.spec.ts: real-backend footer assertion tolerates the commit suffix
- docs/DEVELOPMENT.md: footer paragraph describes the commit

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently: a double-submit fix plausibly adds tests there). TEST-10 does not modify frontend/src/components/LandingPage.tsx.
- frontend/src/api/version.ts and frontend/src/api/version.test.ts may also be modified by CHORE-02 (independent, could run concurrently: a fetch timeout on the same client).
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently).
- e2e/tests/TEST-08_footer_app_version.spec.ts may also be modified by CHORE-02 (independent, could run concurrently: a TEST-08 follow-up).
