# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled `Save note` button while a save is pending
- frontend/src/components/NoteForm.test.tsx: new cases for the double submit and the guard's release

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: the feature map flags BUG-04 with TEST-08 (merged this run) and TEST-10 on this file; this plan does NOT modify it (the fix is contained in NoteForm.tsx), so the overlap does not materialise.
- backend/app/routers/notes.py, backend/app/services/note_service.py, backend/app/repositories/note_repository.py: flagged with TEST-12 only if the fix were server-side; this plan is client-side only, so no overlap.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other mapped item is known to modify them; TEST-12 (read one note by id) could touch the frontend only if it adds UI, which its title does not suggest.
- No overlap with TEST-06 (backend echo router, backend/app/main.py) or BUG-01 (backend/app/routers/server_time.py), both in flight: backend only.
