# Shared Risk Analysis, TEST-03

## Files this feature will create
- backend/app/core/db.py
- backend/app/core/exceptions.py
- backend/app/models/note.py
- backend/app/schemas/note.py
- backend/app/repositories/note_repository.py
- backend/app/services/note_service.py
- backend/app/routers/notes.py
- backend/tests/unit/test_note_service_unit.py
- backend/tests/integration/test_notes_integration.py
- frontend/src/api/notesClient.ts
- frontend/src/components/Notes.tsx
- frontend/src/components/Notes.test.tsx
- e2e/tests/TEST-03_simple_note_form.spec.ts
- e2e/uat/scenarios/TEST-03_simple_note_form.feature
- e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md

## Existing files this feature will modify
- backend/pyproject.toml: adds `sqlalchemy` and `psycopg[binary]` dependencies (and regenerates `backend/uv.lock`)
- backend/app/main.py: registers the notes router, CORS middleware, `AppException` handler, and lifespan schema creation
- backend/app/core/config.py: adds the `cors_origins` setting
- backend/tests/conftest.py: adds the real-database fixtures (module-scoped engine + `create_schema()` migration runner, per-test rollback session, integration client)
- frontend/src/components/LandingPage.tsx: renders `<Notes />` inside `<main>`
- frontend/src/components/LandingPage.test.tsx: mocks the notes client for the embedded component

## Potential conflicts with other independent features
- `backend/app/main.py` may also be modified by TEST-02 (independent, could run concurrently): both register a router in `create_app`, matching the existing `feature_map.md` shared_risk_notes flag for this pair — serialize rather than run concurrently.
- `backend/app/core/db.py`, `backend/app/core/config.py`, `backend/tests/conftest.py`, `backend/pyproject.toml`/`backend/uv.lock` may also be modified by TEST-02 (independent, could run concurrently): the scaffold-era comments in `config.py` and `conftest.py` earmark the DB connectivity layer and DB test fixtures for TEST-02 (a DB-backed health check), while this plan introduces them because TEST-03 does not depend on TEST-02. Whichever item lands second must reuse the already-merged engine/session module and fixtures instead of duplicating them — serialize the pair and rebase the later one.
- `frontend/src/components/LandingPage.tsx` (and `LandingPage.test.tsx`) may also be modified by TEST-04 (independent, could run concurrently), per the existing `feature_map.md` flag. Note: the TEST-04 footer already exists on main, so this risk is materially retired; the flag is kept only until TEST-04 is formally Done.
- TEST-05 (version endpoint) also touches `backend/app/main.py` per `feature_map.md`, but its router registration already exists on main, so no live conflict is expected.
