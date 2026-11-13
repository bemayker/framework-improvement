# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (useRef plus isSaving state) and disabled submit button while saving
- frontend/src/components/NoteForm.test.tsx: three new unit tests for the double submit, the disabled state and the retry after failure

## Potential conflicts with other independent features
- None on frontend/src/components/LandingPage.tsx: the feature_map flag against TEST-08 and TEST-10 assumed BUG-04 might edit the landing page's submit wiring; this plan keeps the fix inside NoteForm and does not touch LandingPage.tsx, so the TEST-08 and TEST-10 serialization advice on that file can be relaxed.
- None on frontend/src/api/notes.ts: TEST-08 (PR #744) rewrites its base-URL handling; BUG-04 does not touch the API client.
- None on backend/app/routers/notes.py, backend/app/services/note_service.py or backend/app/repositories/note_repository.py: the fix is client-side, so TEST-12 (adds GET by id there) does not collide.
- e2e/tests/TEST-03_simple_note_form.spec.ts is read as a pattern only, not modified; any item that changes the note form's test ids (note-input, note-submit, note-list-item-*) would break the BUG-04 spec. No item in feature_map.md currently plans that.
