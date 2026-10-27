# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled state on the submit button
- frontend/src/components/NoteForm.test.tsx: regression tests for the double submit

## Potential conflicts with other independent features
- None on file level with TEST-08 (PR #349): TEST-08 edits frontend/src/api/notes.ts, frontend/src/api/baseUrl.ts (new) and frontend/src/components/LandingPage.test.tsx; BUG-04 edits none of them and leaves frontend/src/components/LandingPage.tsx untouched, so the feature_map.md note for the BUG-04 and TEST-08 pair (LandingPage.tsx) does not materialize. Safe to run concurrently.
- None with TEST-10 (LandingPage.tsx, AppFooter.tsx, version client): BUG-04 does not touch LandingPage.tsx.
- None with TEST-12, TEST-14, FEAT-2 or FEAT-3: the fix is client-side, so backend/app/routers/notes.py, services/note_service.py and repositories/note_repository.py are not modified.
- None with TEST-09 and BUG-01 (backend only).
- e2e/tests/TEST-03_simple_note_form.spec.ts is not modified, but its specs exercise NoteForm: a regression in the guard would surface there, which is a test-level coupling, not a file conflict.
