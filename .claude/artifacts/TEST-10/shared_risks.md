# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: read and shorten `commit`; `getBackendVersion` renamed to `getBackendVersionInfo`, returning `{ version, commit }`
- frontend/src/api/version.test.ts: new return shape, commit cases
- frontend/src/components/AppFooter.tsx: render the short commit after the version
- frontend/src/components/AppFooter.test.tsx: new mock name, commit success and no-commit cases
- frontend/src/components/LandingPage.test.tsx: mock of the renamed client function
- e2e/tests/TEST-08_footer_app_version.spec.ts: exact footer text assertion loosened to contains-text

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (feature_map flags the pair; serialize if run concurrently)
- frontend/src/components/LandingPage.test.tsx: feature_map flags BUG-04 on frontend/src/components/LandingPage.tsx. BUG-04's declared whole-feature manifest (frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts, BUG-04 UAT files) shares no path with this plan, which does not touch LandingPage.tsx; no exact-path overlap with BUG-04.
