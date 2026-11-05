# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: return the optional `commit` field
- frontend/src/api/version.test.ts: cases for the `commit` field
- frontend/src/components/AppFooter.tsx: render the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: success, commit-absent, pending and failure paths
- e2e/tests/TEST-08_footer_app_version.spec.ts: exact-text assertion relaxed to a substring match

## Potential conflicts with other independent features
- frontend/src/api/version.ts may also be modified by CHORE-02 (TEST-08 follow-up: fetch timeout; independent of TEST-10, could run concurrently)
- frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently)
- frontend/src/api/version.test.ts may also be modified by CHORE-02 (its timeout tests; independent, could run concurrently)
- No overlap with BUG-04 (in flight: frontend/src/components/NoteForm.tsx, NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts and its UAT files). The map's LandingPage.tsx flag for this pair does not materialize: TEST-10 does not modify frontend/src/components/LandingPage.tsx.
