# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (useRef plus isSaving state) and `disabled` on the Save note button
- frontend/src/components/NoteForm.test.tsx: new Vitest cases for double submit, disabled-while-saving and release after success or failure

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx was flagged in feature_map.md as shared with TEST-08 (wave 3) and TEST-10 (wave 4). This plan does NOT modify it: the fix is contained in NoteForm. The flagged overlap does not materialize; serialization with TEST-08 and TEST-10 is not needed on this file.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other row in feature_map.md names them; no known concurrent item edits them.
- backend/app/routers/notes.py, note_service.py and note_repository.py were flagged as shared with TEST-12 only if the fix were server-side. This plan makes no backend change, so there is no overlap with TEST-12.
- TEST-09 (backend/app/main.py) and BUG-01 (server_time.py), in flight concurrently: disjoint, this plan touches no backend file.
