# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard and disabled Save note button while a save is pending
- frontend/src/components/NoteForm.test.tsx: new unit tests for the guard

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by BUG-04 (the fix stays inside NoteForm.tsx), so the map's flagged overlap with TEST-10 (wave 4) and TEST-08 (merged) on LandingPage.tsx does not materialize; BUG-04 and TEST-10 can build concurrently on file grounds.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no independent item in the neighbours call lists them (TEST-04 and TEST-08 list LandingPage.tsx, LandingPage.test.tsx and footer files only).
- backend/app/routers/notes.py, services/note_service.py, repositories/note_repository.py are NOT modified (the fix is client-side), so the map's conditional overlap with TEST-12, TEST-14, TEST-15, FEAT-2, FEAT-3 and CHORE-04 does not apply.
