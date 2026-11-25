# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` returns `{ version, commit }` instead of a string
- frontend/src/api/version.test.ts: cases updated to the object shape, commit cases added
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: mocks and assertions updated for the commit
- frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock resolves `{ version: "9.9.9", commit: null }` instead of `"9.9.9"`; its `app-version` assertion is unchanged

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, TEST-08 follow-up, could run concurrently; it lists no files yet, the map row names a fetch timeout in version.ts and possibly AppFooter.tsx)
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, footer build note; map row status suggests it is not active)
- BUG-04 (in flight) lists frontend/src/components/NoteForm.tsx, NoteForm.test.tsx and its own UAT files: disjoint from this feature. The map row's LandingPage.tsx warning does not apply to the component, because this plan does not edit LandingPage.tsx; it does edit LandingPage.test.tsx (one mock line), so an item that also edits that test file's `beforeEach` overlaps on it.
- Latent, not a file conflict: e2e/tests/TEST-08_footer_app_version.spec.ts (line 33) asserts the footer text is exactly `Task Notes v${version}`. That assertion is false after this merge on any stack started with BUILD_COMMIT set, not only once CI sets it: `docker-compose.yml` (line 25) passes BUILD_COMMIT through as the backend build arg, and this plan's own manual verification starts the stack with it set, so on that stack the footer reads `Task Notes v0.1.0 (0123456)` and TEST-08's spec fails. It passes only while BUILD_COMMIT is unset (commit `unknown`, no commit shown), which is the default stack and CI today. This plan does not edit TEST-08's spec; a follow-up item must change that assertion (for example to match `app-version` alone, or the footer text with an optional commit suffix).
