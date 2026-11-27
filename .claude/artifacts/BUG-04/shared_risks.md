# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard (ref plus isSaving state), disabled "Save note" button while a save is pending, reset in finally
- frontend/src/components/NoteForm.test.tsx: reproduction test and disabled / re-enabled state tests

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT touched by this feature. The map rows of BUG-04, TEST-08 and TEST-10 flag it as plausibly shared ("note-form submit wiring"), but the fix lives entirely inside NoteForm.tsx; the onCreated callback LandingPage passes is unchanged. No conflict on that file with TEST-08 or TEST-10.
- TEST-10 (Footer shows the build commit, independent, planned concurrently) likely edits frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts: disjoint from this feature's files. No serialization needed between BUG-04 and TEST-10 on the files above.
- TEST-08 (complete; its tree files include frontend/src/api/notes.ts, AppFooter.tsx and LandingPage.test.tsx): this feature edits none of those. Disjoint.
- TEST-12 and the notes backend items (backend/app/routers/notes.py, note_service.py, note_repository.py): disjoint, because this fix is client-side only and adds no server-side de-duplication.
- No independent item's listed files include NoteForm.tsx, NoteForm.test.tsx or the BUG-04 e2e/UAT files (neighbours call: 51 independent rows, 6 with file lists, none overlapping).
