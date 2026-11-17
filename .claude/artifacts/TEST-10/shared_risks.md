# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: getAppVersion() resolves to { version, commit } with a 7-character commit
- frontend/src/api/version.test.ts: cases move to the object shape; commit cases added
- frontend/src/components/AppFooter.tsx: renders the app-footer-commit span next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and no-commit cases for the commit
- frontend/src/components/LandingPage.test.tsx: the getAppVersion mock resolves the object shape

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, planned concurrently in this run: note-form double-submit fix and its tests); TEST-10 changes only the getAppVersion mock line there, so the merge is small but the two builds should be serialized. TEST-10 does NOT modify frontend/src/components/LandingPage.tsx or frontend/src/api/notes.ts.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts and frontend/src/components/AppFooter.tsx (and its test) may also be modified by CHORE-02 (independent, TEST-08 follow-up: fetch timeout on the version client); serialize if run concurrently, since TEST-10 changes getAppVersion's return type.
- e2e/tests/TEST-08_footer_app_version.spec.ts is not modified, but its real-backend test asserts the footer text `Task Notes v{version}` exactly; it stays green only while the E2E environment sets no BUILD_COMMIT. Any later item that sets BUILD_COMMIT in CI or compose must update that assertion.
