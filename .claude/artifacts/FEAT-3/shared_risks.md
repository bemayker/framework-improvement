# Shared Risk Analysis, FEAT-3

## Files this feature will create
- e2e/uat/scripts/FEAT-3_notes_longest_length_uat_script.md
- e2e/uat/scenarios/FEAT-3_notes_longest_length.feature
- .claude/artifacts/FEAT-3/uat_script.md

## Existing files this feature will modify
- backend/app/routers/notes.py: new static route GET /api/notes/longest-length, declared before GET /api/notes/{note_id}
- backend/app/services/note_service.py: new protocol method and service function longest_note_length
- backend/app/repositories/note_repository.py: new SQL constant and repository method longest_note_length
- backend/app/schemas/note.py: new response schema NoteLongestLengthResponse
- backend/tests/unit/test_note_service_unit.py: stub repositories gain longest_note_length; new unit tests
- backend/tests/integration/test_notes_integration.py: new repository and router tests

## Potential conflicts with other independent features
- No live conflict: every other item that edits the notes slice (TEST-12, TEST-14, CHORE-04, TEST-15) is done and FEAT-2 is cancelled, per `feature_map.md`'s FEAT-3 row. No item in flight touches these files.
- backend/app/routers/notes.py may be modified by any future notes item that adds another static GET under /api/notes; such a route must also sit before /notes/{note_id}, and a concurrent one would conflict on the same declaration block. Serialize if one appears.
