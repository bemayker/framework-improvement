# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard and disabled submit button while a save is pending
- frontend/src/components/NoteForm.test.tsx: reproduction test and disabled/re-enabled cases

## Potential conflicts with other independent features
- No file shared with TEST-08 (PR #528, branch feature/TEST-08-footer-app-version). Checked against its actual diff from origin/main: it changes frontend/src/api/notes.ts, frontend/src/api/baseUrl.ts, frontend/src/api/version.ts, frontend/src/api/version.test.ts, frontend/src/components/AppFooter.tsx, frontend/src/components/AppFooter.test.tsx, frontend/src/components/LandingPage.test.tsx, e2e/helpers/backendVersion.ts and TEST-04/TEST-08 e2e and UAT files; BUG-04 touches none of them. The feature_map.md warning about frontend/src/components/LandingPage.tsx does not materialize: this plan leaves LandingPage.tsx unmodified.
- Indirect dependency only: NoteForm.tsx imports createNote from frontend/src/api/notes.ts, which TEST-08 edits (base URL import). The createNote signature is unchanged by TEST-08, so no textual or semantic conflict is expected; the BUG-04 unit tests mock that module.
- TEST-10 (feature_map.md names LandingPage.tsx): not touched by this plan.
- TEST-12 (notes router, service and repository): not touched; this fix is client-side only.
