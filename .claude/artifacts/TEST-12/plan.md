# Implementation Plan, TEST-12: Read one note by id

## Feature
> Add `GET /api/notes/{id}` to the notes API (backend only; notes have `id` and `text`).
>
> ## Acceptance criteria
> * AC1: for a stored note, `GET /api/notes/{id}` returns 200 with `{"id": ..., "text": ...}`.
> * AC2: for an id that does not exist, it returns 404 with `{"detail": "Note not found"}`.
> * AC3: a non-integer id returns 422.
> * AC4: the full backend test suite passes with the new tests included.

## Acceptance Criteria
- [ ] AC1: for a stored note, `GET /api/notes/{id}` returns 200 with `{"id": ..., "text": ...}`.
- [ ] AC2: for an id that does not exist, it returns 404 with `{"detail": "Note not found"}`.
- [ ] AC3: a non-integer id returns 422.
- [ ] AC4: the full backend test suite passes with the new tests included.

## Plan Overview
One read endpoint added to the existing notes slice built by TEST-03, extending each of its three layers in place and in its existing style (no new layer, module or dependency):

- Repository (`backend/app/repositories/note_repository.py`): one parameterized `SELECT id, text FROM notes WHERE id = %s` returning a `Note` or `None`.
- Service (`backend/app/services/note_service.py`): `get_note(repository, note_id) -> Note | None`, logging and re-raising unexpected failures exactly like `create_note` and `list_notes`; the `NoteRepositoryProtocol` gains `get_note`.
- Router (`backend/app/routers/notes.py`): `GET /api/notes/{note_id}` with `note_id: int`, mapping `None` to `HTTPException(404, detail="Note not found")` and a found note to the existing `NoteResponse`. FastAPI's path-parameter validation produces the 422 for a non-integer id (AC3), so no hand-written validation is added.

Nothing else changes: the router is already registered in `backend/app/main.py`, CORS already allows `GET`, the `notes` table (`id BIGINT GENERATED ALWAYS AS IDENTITY`) needs no migration, and the frontend is untouched.

Assumptions (no tracker comments to resolve them; recorded per `user_story_alignment.md` Section 4):
1. Ids are not range-checked. Zero, negative and out-of-range integers are valid integers, so they reach the query and answer 404 (AC2), never 422; only a non-integer path segment (`abc`, `1.5`) is 422 (AC3). An integer above the BIGINT range must still answer 404, not 500: psycopg adapts it as `numeric`, and `bigint = numeric` compares without error, which an integration test pins.
2. The 404 decision lives in the router, not the service: the service returns `None` for "no such note", matching the existing thin-service shape (the module docstring says the service holds only trimming and failure logging), and keeps HTTP semantics out of business logic.
3. The 404 body is FastAPI's standard `HTTPException` shape, which is exactly `{"detail": "Note not found"}`; no custom exception handler.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/notes/{note_id}`: return one stored note by id (200), 404 `{"detail": "Note not found"}` when absent, 422 when `note_id` is not an integer. Declared with `response_model=NoteResponse` and a `responses={404: ...}` entry so the OpenAPI schema documents the not-found case.
- Service layer: `note_service.get_note(repository, note_id: int) -> Note | None`. Passes the repository result through; on an unexpected exception logs `"Reading a note failed (id %d)"` with `logger.exception` and re-raises (same pattern as `create_note` / `list_notes`). `NoteRepositoryProtocol` gains `def get_note(self, note_id: int) -> Note | None: ...`.
- Repository layer: `NoteRepository.get_note(note_id: int) -> Note | None` using a new module constant `GET_NOTE_SQL = "SELECT id, text FROM notes WHERE id = %s"`, `cursor.fetchone()`, returning `None` when no row. Parameterized, never string-formatted.
- Migrations: none. The `notes` table from TEST-03 (`SCHEMA_DDL` in `backend/app/core/db.py`) is read as is.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/notes/{note_id}` (`note_id`: integer path parameter)
- Request: no body, no query parameters.
- Response 200 (AC1), `NoteResponse`: `{"id": 1, "text": "Buy milk"}`
- Response 404 (AC2): `{"detail": "Note not found"}`
- Response 422 (AC3): FastAPI's standard validation body, for example `GET /api/notes/abc` returns `{"detail": [{"type": "int_parsing", "loc": ["path", "note_id"], "msg": "Input should be a valid integer, unable to parse string as an integer", "input": "abc"}]}`. Tests assert the status code and that `loc` names `["path", "note_id"]`, not the message text.

## Technology Selection
- No net-new component, module or dependency: the feature adds one function to each of three existing modules (`note_repository.py`, `note_service.py`, `routers/notes.py`). The 422 for a non-integer id is FastAPI's own path-parameter typing (an installed dependency) chosen over a hand-written validator, and the 404 is FastAPI's `HTTPException` chosen over a custom exception class and handler; neither needs anything built.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-12_read_note_by_id_uat_script.md: manual UAT script, expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-12/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3
- [G] e2e/uat/scenarios/TEST-12_read_note_by_id.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/repositories/note_repository.py: add `GET_NOTE_SQL` and `NoteRepository.get_note(note_id) -> Note | None`
- [B] backend/app/services/note_service.py: add `get_note` to `NoteRepositoryProtocol` and a `get_note(repository, note_id)` service function with failure logging
- [B] backend/app/routers/notes.py: add `GET /api/notes/{note_id}` returning `NoteResponse`, 404 `Note not found` on a miss; update the module docstring to name the new endpoint
- [B] backend/tests/unit/test_note_service_unit.py: extend `RecordingRepository` and `FailingRepository` with `get_note`; add happy path, not-found and failure-logging tests for `note_service.get_note`
- [B] backend/tests/integration/test_notes_integration.py: add repository `get_note` round-trip and miss tests, and router tests for 200, 404 body, 422 (`abc`, `1.5`) and an out-of-BIGINT-range id answering 404

No E2E spec is produced: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage), so `[D]` has no entries and no `e2e/tests/TEST-12_*.spec.ts` file is created.
No dependency change, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` are untouched).
No `[Docs]` entry: this feature changes no project structure, run configuration, dependency or test infrastructure, and `README.md` / `docs/DEVELOPMENT.md` list no individual endpoints, so neither needs an edit.

## Testing Strategy
- Unit tests: `note_service.get_note` with the repository stubbed in memory: returns the stored note (happy path), returns `None` for an unknown id (edge case), logs `Reading a note failed` and re-raises when the repository raises (error case). Test names follow `testing_standards.md` Section 3, e.g. `test_get_note_returns_none_when_note_does_not_exist`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_note_service_unit.py` is extended)
- Integration tests: against real PostgreSQL via the existing `notes_table` and `client` fixtures in `backend/tests/conftest.py` (fresh table per test, order-independent):
  - Repository: insert then `get_note` round-trip returns the same `Note`; `get_note` on an empty table returns `None`.
  - Router: `GET /api/notes/{id}` for a note created via `POST /api/notes` returns 200 and exactly `{"id": <that id>, "text": "Buy milk"}` (AC1); an id that was never created returns 404 with body exactly `{"detail": "Note not found"}` (AC2); `GET /api/notes/abc` and `GET /api/notes/1.5` return 422 with `loc` `["path", "note_id"]` (AC3); `GET /api/notes/99999999999999999999` (above BIGINT) returns 404, not 500 (edge case, assumption 1).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (existing file `test_notes_integration.py` is extended)
- E2E tests: not warranted for this feature (no criterion involves UI navigation or interaction; the endpoint has no frontend consumer). E2E Tests stays ENABLED in CLAUDE.md, but no spec is produced and the per-feature edge-case spec obligation does not arise because E2E is not warranted for any criterion.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion (AC1 to AC4) plus one edge case (an out-of-range id answers 404), phrased against the HTTP API rather than a browser.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Stored note: `GET /api/notes/{id}` returns 200 with `{"id": ..., "text": ...}` | Integration (router + repository), Unit (service) | Verifying it needs no navigation or interaction: it is a router/repository behaviour with no UI consumer |
| 2 | Missing id returns 404 with `{"detail": "Note not found"}` | Integration (router), Unit (service returns `None`) | Verifying it needs no navigation or interaction: it is a router response-mapping behaviour |
| 3 | Non-integer id returns 422 | Integration (router) | Verifying it needs no navigation or interaction: it is FastAPI path-parameter validation, observable only over HTTP |
| 4 | Full backend test suite passes with the new tests included | Unit + Integration (whole backend suite executed) | Verifying it needs no navigation or interaction: it is a property of the suite run itself (`uv run --directory backend pytest -q`, 0 failed) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Stored note returns 200 with id and text | covered at Integration, see Criterion coverage | Given a note "Buy milk" was created with id N, When GET /api/notes/N, Then 200 and body {"id": N, "text": "Buy milk"} |
| 2 | Missing id returns 404 Note not found | covered at Integration, see Criterion coverage | Given no note has id 999999, When GET /api/notes/999999, Then 404 and body {"detail": "Note not found"} |
| 3 | Non-integer id returns 422 | covered at Integration, see Criterion coverage | Given the API is running, When GET /api/notes/abc, Then 422 naming path parameter note_id |
| 4 | Full backend suite passes | covered at Unit + Integration, see Criterion coverage | Given the branch is checked out with a database available, When the backend suite runs, Then 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified over HTTP with curl against the running backend, plus one test-suite run.

Shared prerequisites for criteria 1 to 3: the stack is up (`docker compose up -d --build` from the repository root) and the backend answers on `http://localhost:8010` (the port `docker-compose.yml` publishes for the `backend` service; if a handover rebuild moved it to a free port, use the backend URL the handover reports instead). Confirm with `curl -s http://localhost:8010/api/health`, which returns a JSON body with a 200.

### Criterion 1: for a stored note, `GET /api/notes/{id}` returns 200 with `{"id": ..., "text": ...}`
Prerequisites: shared prerequisites above.
1. Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Buy milk"}'` → a 201 body such as `{"id": 7, "text": "Buy milk"}`; note the `id` value (7 in this example).
2. Run `curl -s -i http://localhost:8010/api/notes/7` (with the id from step 1) → status line `HTTP/1.1 200 OK` and body exactly `{"id": 7, "text": "Buy milk"}`.
3. Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "  Walk dog  "}'`, note the returned id (say 8), then `curl -s http://localhost:8010/api/notes/8` → body `{"id": 8, "text": "Walk dog"}`, the stored (trimmed) text, and not the note from step 1.

### Criterion 2: for an id that does not exist, it returns 404 with `{"detail": "Note not found"}`
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/notes` and confirm no note in the list has id `999999` (a fresh database never reaches it).
2. Run `curl -s -i http://localhost:8010/api/notes/999999` → status line `HTTP/1.1 404 Not Found` and body exactly `{"detail": "Note not found"}`.
3. Run `curl -s -i http://localhost:8010/api/notes/0` → `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}` (zero is an integer, so it is a miss, not a validation error).
4. Run `curl -s -i http://localhost:8010/api/notes/99999999999999999999` → `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}`, not a 500.

### Criterion 3: a non-integer id returns 422
Prerequisites: shared prerequisites above.
1. Run `curl -s -i http://localhost:8010/api/notes/abc` → status line `HTTP/1.1 422 Unprocessable Entity` (some servers print `422 Unprocessable Content`) and a JSON body whose `detail[0].loc` is `["path", "note_id"]`.
2. Run `curl -s -i http://localhost:8010/api/notes/1.5` → `422` with the same `loc` `["path", "note_id"]`.

### Criterion 4: the full backend test suite passes with the new tests included
Prerequisites: on branch `feature/TEST-12-read-note-by-id`, a PostgreSQL reachable through `DATABASE_URL` (the CLAUDE.md Backing Services recipe, or the compose `db` service on `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`), and `uv` installed.
1. Run `uv run --directory backend pytest -q` → the summary line reports `0 failed` (no failures and no errors) across the whole backend suite, which includes `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py`.
2. Run `uv run --directory backend pytest -q tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py -k get_note` → the new `get_note` tests are collected (the count is not zero) and the summary reports `0 failed`.
