# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion` renamed to `getBackendBuildInfo`, returns version and 7-character commit
- frontend/src/api/version.test.ts: tests for the new return shape
- frontend/src/components/AppFooter.tsx: renders the commit span next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and commit-unavailable tests against the renamed client
- frontend/src/components/LandingPage.test.tsx: version-client mock renamed (import line 5, mock block lines 12 to 17, beforeEach lines 33 to 34); no other change
- e2e/tests/TEST-08_footer_app_version.spec.ts: line 8 only, asserts the `app-footer-version` span instead of the whole footer text; the 503 test is unchanged

Not modified: frontend/src/components/LandingPage.tsx, NoteForm.tsx, NoteForm.test.tsx, frontend/src/api/notes.ts, any backend file.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently). BUG-04's own shared_risks lists only NoteForm.tsx and NoteForm.test.tsx, so the overlap exists only if BUG-04's plan adds a LandingPage test; TEST-10's edit is confined to the version-client mock lines, a different region from the note-form tests. TEST-10 does not touch LandingPage.tsx, NoteForm or frontend/src/api/notes.ts.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout).
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, footer build note).
