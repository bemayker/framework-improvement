# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: return `{ version, commit }` instead of a bare version string; normalize the commit
- frontend/src/api/version.test.ts: tests for the new return shape and commit normalization
- frontend/src/components/AppFooter.tsx: render the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure cases for the commit
- frontend/src/components/LandingPage.test.tsx: its `fetchBackendVersion` mock resolves the new shape

## Potential conflicts with other independent features
- BUG-04 (in flight on feature/BUG-04-double-submit-note): no overlap. Its whole-feature file set is frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts and BUG-04-named UAT files; TEST-10 touches none of them. feature_map.md's flag that both plausibly edit frontend/src/components/LandingPage.tsx does not hold for this plan: TEST-10 does not modify LandingPage.tsx, only LandingPage.test.tsx (a mock's return shape), which is outside BUG-04's set. Safe to run concurrently.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (flagged in feature_map.md; serialize if run concurrently).
- frontend/src/components/LandingPage.test.tsx mocks the version client: any concurrent item editing that test file should be serialized with TEST-10.
