# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` returns `{ version, commit }` instead of a bare version string
- frontend/src/api/version.test.ts: client tests for the commit field and the new return shape
- frontend/src/components/AppFooter.tsx: renders the short commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure component tests with the commit
- frontend/src/components/LandingPage.test.tsx: `fetchBackendVersion` mock resolves the new shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: exact footer-text assertion relaxed so a following commit does not break it

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; the map row flags LandingPage.tsx, which this plan does NOT modify, but BUG-04's note-form submit fix plausibly edits the page test this plan edits)
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout in the same client)
- frontend/src/api/version.test.ts and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently)
- frontend/src/components/LandingPage.test.tsx was last edited by TEST-03 (complete, listed with files by the neighbours call); no live conflict
