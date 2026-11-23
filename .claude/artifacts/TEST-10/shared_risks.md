# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` returns `{ version, commit }` instead of a string
- frontend/src/api/version.test.ts: assertions follow the new return shape, commit cases added
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: mocks follow the new shape, commit cases added
- frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock resolves `{ version: BACKEND_VERSION, commit: null }`, existing assertions unchanged

## Potential conflicts with other independent features
- BUG-04 (building now): its manifest is frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts and BUG-04 UAT files; TEST-10 touches none of them. The feature_map note that TEST-10 and BUG-04 both plausibly edit frontend/src/components/LandingPage.tsx does not hold for this plan: TEST-10 leaves LandingPage.tsx untouched. TEST-10 now edits frontend/src/components/LandingPage.test.tsx (mock shape only); if BUG-04's build also touches that test file, the two edits are on different lines (BUG-04 would add note-form cases, TEST-10 changes one mock line in `beforeEach`), so a textual merge conflict is unlikely, but serialize the merge if BUG-04's diff shows that file.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, independent, could run concurrently); serialize if both are scheduled. CHORE-02 lists no files yet. Any item that mocks `fetchBackendVersion` after TEST-10 merges must resolve the `{ version, commit }` shape.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (footer build note, independent, could run concurrently); serialize if both are scheduled.
- Regression note, not a file conflict: TEST-08's e2e/tests/TEST-08_footer_app_version.spec.ts asserts the exact footer text `Task Notes v{version}`. It stays green only while the E2E backend runs with `BUILD_COMMIT` unset (commit `unknown`); CI and docker-compose.yml currently leave it unset. Any item that sets `BUILD_COMMIT` in the E2E environment must update that spec.
