# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion` replaced by `getBackendBuildInfo` (version and commit)
- frontend/src/api/version.test.ts: tests retargeted, commit cases added
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and commit-less tests
- frontend/src/components/LandingPage.test.tsx: the `../api/version` mock only (import, factory, constant, two beforeEach lines)

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; BUG-04 plausibly adds double-submit tests there). TEST-10's edit is confined to the version mock lines, so a conflict would be textual and small, but the file is shared: serialize. TEST-10 does NOT modify frontend/src/components/LandingPage.tsx or frontend/src/api/notes.ts, contrary to the feature map's earlier guess.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, independent of TEST-10, could run concurrently; it plausibly adds a fetch timeout to the version client). Serialize.
