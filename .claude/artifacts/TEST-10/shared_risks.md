# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `VersionInfo` gains `commit: string | null`; `fetchBackendVersion` resolves the object instead of a string
- frontend/src/api/version.test.ts: assertions follow the new return shape; commit normalisation cases
- frontend/src/components/AppFooter.tsx: renders the 7-character commit beside the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and version-alone paths

## Potential conflicts with other independent features
None. TEST-10 is the only remaining node in `feature_map.md` (wave 4); its dependencies TEST-08 and TEST-09, the only other items touching these files or the version endpoint, are merged. No concurrently runnable item modifies `frontend/src/api/version.ts` or `frontend/src/components/AppFooter.tsx`.
