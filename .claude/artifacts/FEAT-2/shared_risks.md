# Shared Risk Analysis, FEAT-2

## Files this feature will create
- e2e/uat/scripts/FEAT-2_notes-total-length-endpoint_uat_script.md
- e2e/uat/scenarios/FEAT-2_notes-total-length-endpoint.feature
- .claude/artifacts/FEAT-2/uat_script.md

## Existing files this feature will modify
- backend/app/routers/notes.py: add the static `GET /api/notes/total-length` route between `/notes/count` and `/notes/{note_id}`
- backend/app/services/note_service.py: add `total_length` to the protocol and the service
- backend/app/repositories/note_repository.py: add `TOTAL_LENGTH_SQL` and `total_length()`
- backend/app/schemas/note.py: add `NoteTotalLengthResponse`
- backend/tests/unit/test_note_service_unit.py: extend both stub repositories, add service tests
- backend/tests/integration/test_notes_integration.py: add repository and router tests

## Potential conflicts with other independent features
- backend/app/routers/notes.py, services/note_service.py, repositories/note_repository.py and tests/integration/test_notes_integration.py are also modified by TEST-14, CHORE-04 and TEST-15 (feature_map.md shared-risk notes). All three are complete and merged on main 3982641, so there is no concurrent overlap; this plan is written against main as it stands, including TEST-15's `/notes/count` route.
- Any later item adding another static GET under `/api/notes/` would edit the same declaration-order region of backend/app/routers/notes.py and both stub repositories in test_note_service_unit.py; serialize with FEAT-2 if one is planned concurrently. None is in feature_map.md today.
