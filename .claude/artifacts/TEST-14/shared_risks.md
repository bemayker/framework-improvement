# Shared Risk Analysis, TEST-14

## Files this feature will create
- e2e/uat/scripts/TEST-14_delete_note_by_id_uat_script.md
- e2e/uat/scenarios/TEST-14_delete_note_by_id.feature
- .claude/artifacts/TEST-14/uat_script.md

## Existing files this feature will modify
- backend/app/routers/notes.py: add `DELETE /api/notes/{note_id}` and a shared `NOTE_NOT_FOUND_DETAIL` constant used by the existing GET-by-id 404
- backend/app/services/note_service.py: add `delete_note` to the repository protocol and a `delete_note` service function
- backend/app/repositories/note_repository.py: add `DELETE_NOTE_SQL` and `NoteRepository.delete_note`
- backend/tests/unit/test_note_service_unit.py: extend the stub repositories and add delete tests
- backend/tests/integration/test_notes_integration.py: add repository and router delete tests

## Potential conflicts with other independent features
None among open items. Every file above was last changed by TEST-12 (merged as 390f501, a dependency of this item, so not concurrent) and TEST-03 (done). Per the feature map and the orchestrator's shared-risk inference, no other open item that could run concurrently with TEST-14 touches the notes router, service, repository or their test files. Any later notes item (update, search) would collide on all five modified files and should be serialized after TEST-14.
