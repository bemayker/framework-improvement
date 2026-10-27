# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` returns `{ version, commit }`; commit normalised to its first 7 characters
- frontend/src/api/version.test.ts: new return shape and commit cases
- frontend/src/components/AppFooter.tsx: renders the commit span next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and no-usable-commit cases
- frontend/src/components/LandingPage.test.tsx: `fetchBackendVersion` mock reshaped to `{ version, commit }`
- docs/DEVELOPMENT.md: the `BUILD_COMMIT` paragraph's "Nothing in the frontend reads the commit yet." replaced with the footer behaviour

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix adds a landing-page level test. BUG-04 is planning concurrently and its stated scope is frontend/src/components/NoteForm.tsx and NoteForm.test.tsx, which this item does not touch; feature_map.md flags LandingPage.tsx for the pair, and this item does not modify LandingPage.tsx.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, independent, could run concurrently): feature_map.md flags the pair; serialize.
- The return-type change of `fetchBackendVersion` breaks any concurrent branch that mocks or calls it with the old `string | null` shape (CHORE-02 in particular); whichever merges second must adapt its mocks.
- e2e/tests/TEST-08_footer_app_version.spec.ts asserts the exact footer text `Task Notes v{version}`. It stays valid only while CI leaves `BUILD_COMMIT` unset (the backend then reports `unknown` and no commit renders). A later change that sets `BUILD_COMMIT` in CI or the E2E stack must update that spec.
- BUG-03, CHORE-03 and FEAT-6 depend on this item and edit AppFooter.tsx and the version client after it; they are not concurrent with it.
