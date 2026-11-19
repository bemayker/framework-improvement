# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: read and normalise the `commit` field, return `{ version, commit }`
- frontend/src/api/version.test.ts: object return and commit cases
- frontend/src/components/AppFooter.tsx: render the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and no-commit paths
- frontend/src/components/LandingPage.test.tsx: the `../api/version` mock resolves the new object shape (assertions unchanged)
- e2e/tests/TEST-08_footer_app_version.spec.ts: exact footer text assertion allows an optional commit suffix

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; planned in parallel this run). TEST-10 changes only the `vi.mock("../api/version", ...)` block; it does not edit frontend/src/components/LandingPage.tsx.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout).
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent; frontend footer build note).
