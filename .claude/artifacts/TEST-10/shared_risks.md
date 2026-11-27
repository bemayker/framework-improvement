# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: resolves to `{ version, commit }` or `null` instead of a bare string
- frontend/src/api/version.test.ts: follows the new shape, adds commit cases
- frontend/src/components/AppFooter.tsx: renders the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: follows the new shape, adds commit cases
- frontend/src/components/LandingPage.test.tsx: the version mock resolves to the new shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: exact footer text includes the commit when the backend reports one

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout in the version client per the feature map).
- BUG-04 (in flight concurrently): no shared entry. Its manifest is frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts, e2e/uat/scenarios/BUG-04_double_submit_note.feature, e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md and .claude/artifacts/BUG-04/uat_script.md; none appears above. The feature map's warning that both edit frontend/src/components/LandingPage.tsx does not hold: neither plan modifies LandingPage.tsx (TEST-10 touches only LandingPage.test.tsx, which BUG-04 does not list).
