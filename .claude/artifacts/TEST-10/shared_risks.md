# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion` renamed to `getBackendVersionInfo`, returning the version and a nullable commit
- frontend/src/api/version.test.ts: client tests follow the rename and cover the commit
- frontend/src/components/AppFooter.tsx: renders the first 7 characters of the commit after the version
- frontend/src/components/AppFooter.test.tsx: commit success, pending, failure and unknown-commit tests
- frontend/src/components/LandingPage.test.tsx: the `../api/version` mock follows the rename (mock lines only)

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, building now): the map row flags LandingPage.tsx for the pair, but BUG-04's recorded File Manifest lists only NoteForm.tsx, NoteForm.test.tsx, its E2E spec and its UAT files, so there is no file overlap on record. TEST-10 does not touch LandingPage.tsx. If BUG-04's build adds a LandingPage.test.tsx edit, the overlap is the mock block only (lines 5, 12 to 14, 20, 33 to 34) and a rebase resolves it.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, TEST-08 follow-up; no files on record). Serialize if both run concurrently.
- Existing E2E specs e2e/tests/TEST-04_page_footer.spec.ts and e2e/tests/TEST-08_footer_app_version.spec.ts read the footer: they use `toContainText` on `app-footer` and `toHaveText` on `app-footer-version`, both of which stay true because the commit is a separate sibling span. Not modified.
