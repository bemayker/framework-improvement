# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: getBackendVersion returns { version, commit } instead of a bare version string
- frontend/src/components/AppFooter.tsx: renders the first 7 characters of the commit after the version
- frontend/src/api/version.test.ts: client tests follow the new return shape, plus commit cases
- frontend/src/components/AppFooter.test.tsx: footer tests follow the new shape, plus commit success, pending, failure cases
- frontend/src/components/LandingPage.test.tsx: the version-client mock resolves the new object shape (mock value only)

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04's double-submit fix plausibly adds note-form tests to this file. TEST-10 changes only the getBackendVersion mock value in beforeEach; a textual conflict is possible, a semantic one is not. frontend/src/components/LandingPage.tsx itself is NOT modified by TEST-10, so the map's LandingPage.tsx warning does not apply to it.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout). Serialize: TEST-10 changes getBackendVersion's return type, which every caller and mock CHORE-02 writes would have to follow.
