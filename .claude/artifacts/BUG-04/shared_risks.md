# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (useRef flag, isSaving state, finally release, disabled button)
- frontend/src/components/NoteForm.test.tsx: reproduction test and guard-release tests

## Potential conflicts with other independent features
- None on file level. The fix stays inside NoteForm.tsx and its test; it does not touch frontend/src/components/LandingPage.tsx, LandingPage.test.tsx, AppFooter.tsx or the API clients, so the map's provisional warning against TEST-08 and TEST-10 (LandingPage.tsx) does not materialize, and BUG-04 can run concurrently with TEST-10 and CHORE-02. No neighbour's listed files include NoteForm.tsx or NoteForm.test.tsx (checked against TEST-02, TEST-04, TEST-05, TEST-08, TEST-09 and BUG-01, the six items with file lists).
- The fix is client-side only, so the backend notes slice (backend/app/routers/notes.py, services/note_service.py, repositories/note_repository.py) that TEST-12's row names is untouched.
