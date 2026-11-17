# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard and disabled submit button while a save is in progress
- frontend/src/components/NoteForm.test.tsx: new unit cases for the double-submit guard

## Potential conflicts with other independent features
- None of this feature's files appears in any independent item's file list (neighbours call: rows=42 independent=39 with-files=6).
- TEST-08 (PR #830, not yet merged) changes frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx and frontend/src/components/LandingPage.test.tsx. BUG-04 touches none of them: the fix stays inside NoteForm.tsx and imports `createNote` from `../api/notes` unchanged, so it is unaffected by TEST-08 moving API_BASE_URL into frontend/src/api/baseUrl.ts. The map's flagged overlap on frontend/src/components/LandingPage.tsx (TEST-08, TEST-10) does not materialize: BUG-04 does not edit LandingPage.tsx. Build after TEST-08 merges as scheduled.
- TEST-12 (and the notes chain TEST-14, FEAT-2, FEAT-3) edit backend/app/routers/notes.py, note_service.py and note_repository.py; BUG-04 is client-side only and edits none of them.
- e2e/tests/TEST-03_simple_note_form.spec.ts is read as a pattern only, not modified.
