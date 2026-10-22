# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and a disabled "Save note" button while a save is pending
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state

## Potential conflicts with other independent features
- TEST-08 (PR open, not merged) changes frontend/src/components/AppFooter.tsx, frontend/src/components/LandingPage.test.tsx, frontend/src/api/version.ts and frontend/src/api/notes.ts (now importing the new frontend/src/api/baseUrl.ts). BUG-04 touches none of those files: its fix stays inside NoteForm.tsx and NoteForm.test.tsx, and it does not edit frontend/src/components/LandingPage.tsx, which the feature map flagged as plausibly shared. No file overlap; the map's serialization note for this pair can be relaxed. NoteForm.test.tsx mocks ../api/notes wholesale, so TEST-08's change to notes.ts does not reach it.
- TEST-10 (wave 4) is flagged in the map as plausibly editing frontend/src/components/LandingPage.tsx; BUG-04 does not edit it, so no overlap.
- TEST-12 and its notes-backend successors (TEST-14, TEST-15, FEAT-2, FEAT-3, CHORE-04) edit backend/app/routers/notes.py, services/note_service.py and repositories/note_repository.py; BUG-04's fix is client-side and edits none of them, so no overlap.
- e2e/tests/TEST-03_simple_note_form.spec.ts is not modified, but it exercises the same "Save note" button: its single-click flows are unaffected by a guard that only drops a second submit while one is in flight.
