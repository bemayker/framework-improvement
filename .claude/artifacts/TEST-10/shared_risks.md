# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `VersionInfo` gains optional `commit`; client returns it when usable
- frontend/src/api/version.test.ts: commit cases replace the "ignores commit" case
- frontend/src/components/AppFooter.tsx: renders ` ({first 7 of commit})` after the version
- frontend/src/components/AppFooter.test.tsx: success-with-commit, no-commit, pending, failure cases
- e2e/tests/TEST-08_footer_app_version.spec.ts: re-pointed so it no longer asserts the commit is absent

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, wave 4, no dependency on TEST-10; feature_map already flags the pair for serialization). Reported as not open in this run.
- frontend/src/components/LandingPage.tsx is flagged in feature_map against BUG-04, but this plan does not modify it; BUG-04 is merged (#151).
- BUG-03 and CHORE-03 depend on TEST-10 (wave 5) and will edit these same footer files after it merges; dependent, not concurrent.
- CHORE-06 (in flight) is artifact-only: no overlap.
