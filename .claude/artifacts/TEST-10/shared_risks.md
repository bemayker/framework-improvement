# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: return `{ version, commit }` instead of the version string
- frontend/src/api/version.test.ts: object-shape expectations and commit cases
- frontend/src/components/AppFooter.tsx: render the first 7 commit characters after the version
- frontend/src/components/AppFooter.test.tsx: object-shape mock and commit success, pending, failure cases
- frontend/src/components/LandingPage.test.tsx: `getBackendVersion` mock resolves the object shape

## Potential conflicts with other independent features
- frontend/src/api/version.ts may also be modified by CHORE-02 (independent, could run concurrently; its map row names a fetch timeout in this client and possibly AppFooter.tsx; its own shared_risks lists no files yet)
- frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently)
- frontend/src/components/LandingPage.test.tsx: no independent item lists it. BUG-04's map row flags frontend/src/components/LandingPage.tsx, which TEST-10 does not touch; BUG-04's own file list (NoteForm.tsx, NoteForm.test.tsx, its e2e and UAT files) is disjoint from this feature.
