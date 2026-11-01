# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: result widened from the version string to `{ version, commit }`, commit cut to 7 characters or `null`
- frontend/src/api/version.test.ts: cases for the new result shape and the commit rules
- frontend/src/components/AppFooter.tsx: renders the commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths on the new shape
- frontend/src/components/LandingPage.test.tsx: version mock returns the new shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: real-backend assertion tolerates a commit suffix
- docs/DEVELOPMENT.md: footer paragraph describes the commit

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx was flagged in `feature_map.md` as shared with BUG-04; this plan does not modify it, and BUG-04 is complete.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx were flagged as shared with CHORE-02; CHORE-02 is cancelled.
- No other item can run concurrently with TEST-10 in this run, so no pair needs serializing. Any later item that consumes `fetchBackendVersion` must use the widened `BackendVersion | null` result.
