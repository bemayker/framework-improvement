# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: returns `{ version, commit }` instead of the version string
- frontend/src/api/version.test.ts: commit cases, object return
- frontend/src/components/AppFooter.tsx: renders the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure, version-without-commit
- frontend/src/components/LandingPage.test.tsx: version mock returns the new object shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: exact footer text assertion loosened to contain
- docs/DEVELOPMENT.md: footer paragraph

## Potential conflicts with other independent features
- BUG-04 (branch feature/BUG-04-double-submit-note, in flight, not merged): its manifest is frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts and its own UAT files. **This manifest lists none of them**: no overlap. The feature map's flag on frontend/src/components/LandingPage.tsx does not materialize either, because this item does not modify LandingPage.tsx; it modifies only LandingPage.test.tsx, which BUG-04's manifest does not list. docs/DEVELOPMENT.md is the only plausible shared file if BUG-04's docs check edits it; different paragraphs, so a textual merge, not a semantic one.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts and frontend/src/components/AppFooter.tsx (and AppFooter.test.tsx) may also be modified by CHORE-02 (TEST-08 follow-up, depends only on TEST-08, independent of TEST-10, could run concurrently). Serialize: this item changes `getBackendVersion`'s return type, so any CHORE-02 edit to the same function conflicts semantically, not only textually.
- e2e/tests/TEST-08_footer_app_version.spec.ts may also be touched by CHORE-02 as a TEST-08 follow-up (independent, could run concurrently).
