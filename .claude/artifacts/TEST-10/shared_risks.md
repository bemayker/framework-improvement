# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchAppVersion()` returns `{ version, commit } | null` instead of `string | null`
- frontend/src/api/version.test.ts: cases for the commit field and the new return shape
- frontend/src/components/AppFooter.tsx: appends ` ({commit})` after the version
- frontend/src/components/AppFooter.test.tsx: success with and without commit, pending, failure
- frontend/src/components/LandingPage.test.tsx: version-client mock returns the new shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: live-response test expects the commit suffix when the response carries one

## Potential conflicts with other independent features
- No file overlap with BUG-04 (planned concurrently). BUG-04 edits frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx and creates e2e/tests/BUG-04_double_submit_note.spec.ts plus its UAT files; this plan touches none of them. Neither plan modifies frontend/src/components/LandingPage.tsx, so the feature map's LandingPage.tsx warning for this pair does not apply. One near miss: this plan edits frontend/src/components/LandingPage.test.tsx (the version-client mock only, lines 12 to 17 and 34); BUG-04's plan does not list that file, but if its build adds a LandingPage-level double-submit test there, the two edits sit in different blocks of the same file and merge textually. No build serialization needed.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up: fetch timeout; independent of TEST-10, could run concurrently). Real overlap: both change `fetchAppVersion()` and CHORE-02 may change AppFooter's effect. Serialize the builds; whichever lands second rebases onto the other's `fetchAppVersion` signature.
- frontend/src/components/AppFooter.test.tsx and frontend/src/api/version.test.ts follow the same CHORE-02 overlap.
