# Shared Risk Analysis, TEST-15

## Files this feature will create
- e2e/uat/scripts/TEST-15_count_notes_uat_script.md
- e2e/uat/scenarios/TEST-15_count_notes.feature
- .claude/artifacts/TEST-15/uat_script.md

## Existing files this feature will modify
- backend/app/repositories/note_repository.py: add `COUNT_NOTES_SQL` and `NoteRepository.count_notes()`
- backend/app/services/note_service.py: add `count_notes` to the protocol and a `count_notes` service function
- backend/app/schemas/note.py: add `NoteCountResponse`
- backend/app/routers/notes.py: add `GET /api/notes/count`, declared before `GET /api/notes/{note_id}`
- backend/tests/unit/test_note_service_unit.py: extend the stub repositories and add count tests
- backend/tests/integration/test_notes_integration.py: add repository and router count tests

## Potential conflicts with other independent features
- backend/app/repositories/note_repository.py, backend/app/services/note_service.py, backend/app/routers/notes.py and both notes test files were last modified by TEST-14 (a dependency, merged a65e01c) and CHORE-04 (TEST-14 follow-up, complete, merged 8d9936e). Neither is open, so there is no live conflict.
- No other item in `.claude/feature_map.md` that could run concurrently with TEST-15 touches the notes slice: every other row is done, or edits frontend or non-notes backend files only.
