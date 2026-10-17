# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: read and normalise the commit field, return version and commit together
- frontend/src/api/version.test.ts: expectations for the new result shape and commit rules
- frontend/src/components/AppFooter.tsx: render the commit span next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths with the commit

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, wave 4, no dependency between the two; fetch timeout vs reading the commit field). Serialize if run concurrently.
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (the footer component is edited, not its host), so the feature_map flag against BUG-04 does not apply; BUG-04 is also already merged.
- BUG-03 and CHORE-03 depend on TEST-10 and run after it, so they cannot run concurrently with it.
