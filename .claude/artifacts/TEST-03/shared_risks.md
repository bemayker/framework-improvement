# Shared Risk Analysis, TEST-03

## Files this feature will create
- backend/app/core/db.py
- backend/app/models/note.py
- backend/app/schemas/note.py
- backend/app/repositories/note_repository.py
- backend/app/services/note_service.py
- backend/app/routers/notes.py
- backend/tests/unit/test_note_service_unit.py
- backend/tests/integration/test_notes_integration.py
- frontend/src/api/notes.ts
- frontend/src/components/NoteForm.tsx
- frontend/src/components/NoteList.tsx
- frontend/src/components/NoteForm.test.tsx
- frontend/src/components/NoteList.test.tsx
- e2e/tests/TEST-03_simple_note_form.spec.ts
- e2e/uat/scenarios/TEST-03_simple_note_form.feature
- e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: register the notes router, add CORSMiddleware, add lifespan with conditional create_all
- backend/app/core/config.py: add a cors_origins setting
- backend/pyproject.toml: add sqlalchemy and psycopg[binary] dependencies
- backend/tests/conftest.py: add the real-database fixtures (module-scoped engine, table create/teardown, per-test cleanup)
- frontend/src/components/LandingPage.tsx: add notes state and render NoteForm and NoteList
- frontend/src/components/LandingPage.test.tsx: cover the notes wiring

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-02 (independent, both depend only on TEST-01; `feature_map.md` already flags that both touch the FastAPI app entry for router registration — serialize if run concurrently). TEST-05 carries the same flag for main.py, but its version router is already merged on main, so it is only a live conflict if TEST-05 is revised concurrently.
- backend/tests/conftest.py may also be modified by TEST-02 (the conftest's own note says the health-endpoint item was expected to introduce DB connectivity fixtures there; TEST-03 now introduces them, so a concurrent TEST-02 run would collide on this file — serialize).
- frontend/src/components/LandingPage.tsx may also be modified by TEST-04 (independent, could run concurrently; `feature_map.md` flags exactly this pair — serialize). TEST-04's footer is already present on main, so this is only a live conflict if TEST-04 is revised concurrently.
