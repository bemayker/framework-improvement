# Shared Risk Analysis, TEST-12

## Files this feature will create
- e2e/uat/scripts/TEST-12_read_note_by_id_uat_script.md
- e2e/uat/scenarios/TEST-12_read_note_by_id.feature
- .claude/artifacts/TEST-12/uat_script.md

## Existing files this feature will modify
- backend/app/repositories/note_repository.py: add a select-by-id query and `get_note`
- backend/app/services/note_service.py: add `get_note` to the repository protocol and the service
- backend/app/routers/notes.py: add `GET /api/notes/{note_id}`
- backend/tests/unit/test_note_service_unit.py: extend the in-memory repository stubs, add `get_note` tests
- backend/tests/integration/test_notes_integration.py: add repository and router tests for read-by-id

Not modified: `backend/app/main.py` (the notes router is already registered), `backend/app/core/db.py` (no schema change), `backend/tests/conftest.py`, anything under `frontend/`.

## Potential conflicts with other independent features
- None with an item that can run concurrently. Every other item that touches the notes slice is ordered against TEST-12 by `depends_on`:
  - TEST-14 (Delete a note by id) depends on TEST-12 and will modify the same five notes files (repository, service, router, both test files) and likely `backend/app/main.py` CORS `allow_methods` for `DELETE`. It cannot run concurrently; it must branch from main after TEST-12 merges, or it will conflict in all five files.
  - TEST-03 (Simple note form) created these files and is done.
  - BUG-04 (Saving a note twice quickly stores it twice) is in TEST-12's own wave (3) and shares the TEST-03 dependency, so it is independent of TEST-12; its fix is note-form submit wiring on the frontend (`frontend/src/components/NoteForm.tsx` / `LandingPage.tsx`, spec `e2e/tests/BUG-04_double_submit_note.spec.ts` already on main), disjoint from every file above. If a remaining BUG-04 change were to add server-side de-duplication it would touch `note_repository.py`, `note_service.py` and `test_notes_integration.py`; serialize in that case.
- TEST-13 (Ping endpoint) is independent and not done, and registers a router in `backend/app/main.py`; TEST-12 does not touch `main.py`, so the pair is disjoint.
