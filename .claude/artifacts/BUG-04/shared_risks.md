# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus state), disabled submit button, guard released in finally
- frontend/src/components/NoteForm.test.tsx: repro and guard tests added; existing TEST-03 tests kept

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan, so the feature_map.md serialization flags with TEST-08 (merged) and TEST-10 (footer build commit) on that file do not materialize; TEST-10's LandingPage edits and LandingPage.test.tsx are disjoint from NoteForm.tsx.
- backend/app/routers/notes.py, backend/app/services/note_service.py and backend/app/repositories/note_repository.py are NOT modified (the fix is client-side), so the TEST-12 flag (read one note by id) does not materialize.
- No other item in feature_map.md is expected to edit frontend/src/components/NoteForm.tsx or NoteForm.test.tsx. TEST-09 and BUG-01 (in flight) are backend-only and disjoint.
- e2e/ is shared by every E2E-carrying item, but each spec and UAT file is named per item ({ID}_{slug}), so there is no file overlap.
