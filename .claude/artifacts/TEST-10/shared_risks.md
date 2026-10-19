# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: fetchAppVersion resolves version plus short commit from the same request
- frontend/src/api/version.test.ts: client tests for the new resolved shape and commit rules
- frontend/src/components/AppFooter.tsx: renders the short commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths with the commit
- frontend/src/components/LandingPage.test.tsx: fetchAppVersion mock updated to the new resolved shape

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up), but CHORE-02 is cancelled, so no live conflict.
- frontend/src/components/AppFooter.tsx and the version API client may also be modified by BUG-03 and CHORE-03; both depend on TEST-10 (not independent) and are cancelled.
- frontend/src/components/LandingPage.test.tsx: feature_map flags TEST-10 and BUG-04 on LandingPage.tsx; BUG-04 is merged, and this plan touches only the test file (mock shape), not LandingPage.tsx.
- No independent item is in flight, so nothing needs serializing.
