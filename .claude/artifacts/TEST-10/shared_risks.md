# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion()` resolves `{ version, commit }` (commit cut to 7 characters, or null) instead of a bare string
- frontend/src/api/version.test.ts: commit parsing cases; existing cases moved to the object shape
- frontend/src/components/AppFooter.tsx: renders the `app-footer-commit` span next to the version
- frontend/src/components/AppFooter.test.tsx: success, null-commit, pending and failure paths
- frontend/src/components/LandingPage.test.tsx: the `getBackendVersion` mock resolves the object shape
- e2e/tests/TEST-08_footer_app_version.spec.ts (owned by merged TEST-08): in its first test only, the whole-footer exact-text assertion becomes `toContainText` of `Task Notes v{backendVersion}`, so it holds with or without the `({commit})` span (it would otherwise fail in any run where the stack has `BUILD_COMMIT` set, such as a local run started as README.md documents); the version-span exact check, the frontend-version negative check and the second test are unchanged

## Potential conflicts with other independent features
- CHORE-02 (TEST-08 follow-up: fetch timeout on the version client) is **cancelled in the tracker** (ClickUp 123k99cx6mf, status `cancelled`) and is not a node of this run. It would have touched frontend/src/api/version.ts, version.test.ts and AppFooter.tsx; no serialization with it is needed and none should be held for.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (being approved concurrently, independent). BUG-04's own plan lists only frontend/src/components/NoteForm.tsx, NoteForm.test.tsx and its own e2e/UAT files, so there is no file overlap with its current plan; the risk exists only if BUG-04's build extends the page-level submit test in LandingPage.test.tsx. feature_map.md's warning that BUG-04 and TEST-10 share frontend/src/components/LandingPage.tsx does not apply: TEST-10 does not modify LandingPage.tsx, only its test file's version mock.
