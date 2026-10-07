# Implementation Plan, TEST-14: Delete a note by id

## Feature
> Add `DELETE /api/notes/{id}` to the notes API (backend only). Depends on TEST-12 (reuses its not-found handling; TEST-12 is done, merged as 390f501, which added GET /api/notes/{id}).

## Acceptance Criteria
- [ ] AC1: deleting a stored note returns 204, and `GET /api/notes` no longer lists it.
- [ ] AC2: deleting an id that does not exist returns 404 with `{"detail": "Note not found"}`.
- [ ] AC3: the full backend test suite passes with the new tests included.

## Re-Plan Feedback
None. 0 tracker comments were read on the item (ClickUp task 123k99cxe5y), there is no plan PR (autonomous `/deliver` run), and the dispatch carried no `[merged-since]` lines: this is a fresh plan on a branch cut from current main (32c2a40).

Assumptions (no comments to resolve them; recorded per `user_story_alignment.md` Section 4):
1. "Reuses its not-found handling" means the same 404 status and exact `"Note not found"` detail TEST-12's `GET /api/notes/{note_id}` raises. The literal is lifted into one module constant in `backend/app/routers/notes.py` and both endpoints use it, so the two 404 bodies cannot drift apart. No custom exception class or handler is introduced.
2. Deleting the same id twice answers 404 the second time (the note no longer exists). This is not an extra feature: it is AC2 applied to an id that used to exist, and it gets one integration test.
3. Like TEST-12, an integer id outside the BIGINT range (`99999999999999999999`), zero or a negative id is a miss and answers 404, never 500. A non-integer id answers 422 through FastAPI's own path typing; that is existing framework behaviour, not part of any criterion, and gets no dedicated test here.
4. The 204 response carries an empty body (no JSON), per HTTP semantics for 204.

## Plan Overview
Backend only, one vertical slice through the three existing layers of the notes module: a `delete_note` repository method (parameterized `DELETE`), a `delete_note` service function (failure logging, same shape as `get_note`), and a `DELETE /api/notes/{note_id}` route that maps "nothing deleted" to the shared 404. No schema change, no new module, no new dependency, no frontend work.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `DELETE /api/notes/{note_id}`: delete one stored note by id; 204 with an empty body on success, 404 `{"detail": "Note not found"}` when no note has that id.
- Router (`backend/app/routers/notes.py`): add module constant `NOTE_NOT_FOUND_DETAIL = "Note not found"` and use it in the existing `get_note` 404 as well as the new route. New route: `@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response, responses={404: ...})`, signature `delete_note(note_id: int, repository: NoteRepositoryDependency) -> Response`; calls `note_service.delete_note`, raises `HTTPException(404, NOTE_NOT_FOUND_DETAIL)` when it returns `False`, else returns `Response(status_code=status.HTTP_204_NO_CONTENT)`. Update the module docstring to name the new endpoint (TEST-14).
- Service layer (`backend/app/services/note_service.py`): add `def delete_note(self, note_id: int) -> bool: ...` to `NoteRepositoryProtocol`; add `delete_note(repository, note_id) -> bool` that returns the repository's answer, and on an unexpected exception logs `Deleting a note failed (id %d)` via `logger.exception` and re-raises (mirrors `get_note`).
- Repository layer (`backend/app/repositories/note_repository.py`): add `DELETE_NOTE_SQL = "DELETE FROM notes WHERE id = %s"` and `NoteRepository.delete_note(note_id) -> bool` returning `cursor.rowcount > 0`. Commit stays with the caller: `get_connection` in `app/core/db.py` already commits on success, so the deletion persists without the repository owning a transaction. Update the module docstring ("an insert and two selects" becomes "an insert, two selects and a delete").
- Migrations: none. The `notes` table and its BIGINT identity primary key are unchanged.

## API Integration Plan
No external API integration.

## API Contract
- Method: DELETE
- URL: `/api/notes/{note_id}` (`note_id`: integer path parameter)
- Request: no body.
- Response 204: empty body (no `Content-Type` JSON payload).
- Response 404: `{"detail": "Note not found"}`
- Response 422 (FastAPI default, not a criterion): non-integer `note_id`, e.g. `{"detail": [{"loc": ["path", "note_id"], "msg": "...", "type": "int_parsing"}]}`

## Technology Selection
- No net-new component, module or dependency: the feature adds one function to each of three existing modules (`note_repository.py`, `note_service.py`, `routers/notes.py`). The delete uses a parameterized SQL `DELETE` through the already-installed psycopg and its `cursor.rowcount`, chosen over a `SELECT` then `DELETE` pair (one statement answers both "existed?" and "deleted"); the 404 reuses FastAPI's `HTTPException` (installed) over a custom exception class and handler; the empty 204 uses FastAPI's own `Response` class over a hand-built response.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-14_delete_note_by_id_uat_script.md: manual UAT script, expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-14/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3
- [G] e2e/uat/scenarios/TEST-14_delete_note_by_id.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/repositories/note_repository.py: add `DELETE_NOTE_SQL` and `NoteRepository.delete_note(note_id) -> bool`; update the module docstring
- [B] backend/app/services/note_service.py: add `delete_note` to `NoteRepositoryProtocol` and a `delete_note(repository, note_id) -> bool` service function with failure logging
- [B] backend/app/routers/notes.py: add `NOTE_NOT_FOUND_DETAIL`, use it in `get_note`, add `DELETE /api/notes/{note_id}` (204 empty body, 404 on a miss); update the module docstring
- [B] backend/tests/unit/test_note_service_unit.py: extend `RecordingRepository` and `FailingRepository` with `delete_note`; add happy path, not-found and failure-logging tests for `note_service.delete_note`
- [B] backend/tests/integration/test_notes_integration.py: add repository `delete_note` tests (deletes and returns True, leaves other notes, returns False on a miss) and router tests for 204 plus absence from `GET /api/notes`, 404 body on a never-created id, 404 on a repeated delete, and 404 (not 500) on an out-of-BIGINT-range id

No E2E spec is produced: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage), so `[D]` has no entries and no `e2e/tests/TEST-14_*.spec.ts` file is created.
No dependency change, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` are untouched).
No `[Docs]` entry: this feature changes no project structure, run configuration, dependency or test infrastructure, and `README.md` / `docs/DEVELOPMENT.md` list no individual endpoints, so neither needs an edit.

## Testing Strategy
- Unit tests: `note_service.delete_note` with the repository stubbed in memory: returns `True` and removes the note when it exists (happy path), returns `False` for an unknown id and leaves stored notes untouched (edge case), logs `Deleting a note failed (id 7)` and re-raises when the repository raises (error case). `RecordingRepository` gains a `delete_note` that removes the matching note and reports whether it found one; `FailingRepository` gains one that raises. Names follow `testing_standards.md` Section 3, e.g. `test_delete_note_returns_false_when_note_does_not_exist`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_note_service_unit.py` is extended)
- Integration tests: against real PostgreSQL via the existing `notes_table` and `client` fixtures in `backend/tests/conftest.py` (fresh table per test, order-independent):
  - Repository: insert two notes, `delete_note(first.id)` returns `True` and `list_notes()` returns only the second; `delete_note(1)` on an empty table returns `False`.
  - Router: create "Buy milk" and "Walk dog" via `POST /api/notes`, `DELETE /api/notes/{buy_milk_id}` returns 204 with an empty body, then `GET /api/notes` lists only "Walk dog" and `GET /api/notes/{buy_milk_id}` returns 404 (AC1); `DELETE /api/notes/999999` returns 404 with body exactly `{"detail": "Note not found"}` (AC2); deleting the same id twice returns 204 then 404 with that body (edge, assumption 2); `DELETE /api/notes/99999999999999999999` returns 404, not 500 (edge, assumption 3).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (existing file `test_notes_integration.py` is extended)
- E2E tests: not warranted for this feature (no criterion involves UI navigation or interaction; the endpoint has no frontend consumer and the item is backend only). E2E Tests stays ENABLED in CLAUDE.md, but no spec is produced, and the per-feature edge-case spec obligation does not arise because E2E is warranted for no criterion. A browser spec would have to call the API directly, which `testing_standards.md` Section 5 names as a router integration test, not E2E.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion (AC1 to AC3) plus one edge case (deleting the same note twice answers 404 the second time), phrased against the HTTP API rather than a browser.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Deleting a stored note returns 204 and `GET /api/notes` no longer lists it | Integration (router + repository), Unit (service) | Verifying it needs no navigation or interaction: it is a router/repository behaviour with no UI consumer |
| 2 | Deleting a non-existent id returns 404 with `{"detail": "Note not found"}` | Integration (router), Unit (service returns `False`) | Verifying it needs no navigation or interaction: it is a router response-mapping behaviour |
| 3 | Full backend test suite passes with the new tests included | Unit + Integration (whole backend suite executed) | Verifying it needs no navigation or interaction: it is a property of the suite run itself (`uv run --directory backend pytest -q`, 0 failed) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Delete stored note returns 204 and it leaves the list | covered at Integration, see Criterion coverage | Given notes "Buy milk" (id N) and "Walk dog" exist, When DELETE /api/notes/N, Then 204 with an empty body, And GET /api/notes lists only "Walk dog" |
| 2 | Delete missing id returns 404 Note not found | covered at Integration, see Criterion coverage | Given no note has id 999999, When DELETE /api/notes/999999, Then 404 and body {"detail": "Note not found"} |
| 3 | Full backend suite passes | covered at Unit + Integration, see Criterion coverage | Given the branch is checked out with a database available, When the backend suite runs, Then 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified over HTTP with curl against the running backend, plus one test-suite run.

Shared prerequisites for criteria 1 and 2: the stack is up (`docker compose up -d --build` from the repository root) and the backend answers on `http://localhost:8010` (the port `docker-compose.yml` publishes for the `backend` service; if a handover rebuild moved it to a free port, use the backend URL the handover reports instead). Confirm with `curl -s http://localhost:8010/api/health`, which returns a JSON body with a 200.

### Criterion 1: deleting a stored note returns 204, and `GET /api/notes` no longer lists it
Prerequisites: shared prerequisites above.
1. Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Buy milk"}'` → a 201 body such as `{"id": 7, "text": "Buy milk"}`; note the `id` (7 in this example).
2. Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Walk dog"}'` → a 201 body such as `{"id": 8, "text": "Walk dog"}`.
3. Run `curl -s http://localhost:8010/api/notes` → the list contains both `{"id": 7, "text": "Buy milk"}` and `{"id": 8, "text": "Walk dog"}`.
4. Run `curl -s -i -X DELETE http://localhost:8010/api/notes/7` (the id from step 1) → status line `HTTP/1.1 204 No Content` and no body after the headers.
5. Run `curl -s http://localhost:8010/api/notes` → `{"id": 8, "text": "Walk dog"}` is still listed and no entry has id 7.
6. Run `curl -s -i http://localhost:8010/api/notes/7` → `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}`.

### Criterion 2: deleting an id that does not exist returns 404 with `{"detail": "Note not found"}`
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/notes` and confirm no note in the list has id `999999` (a fresh database never reaches it).
2. Run `curl -s -i -X DELETE http://localhost:8010/api/notes/999999` → status line `HTTP/1.1 404 Not Found` and body exactly `{"detail": "Note not found"}`.
3. Run `curl -s -i -X DELETE http://localhost:8010/api/notes/7` again (the id deleted under Criterion 1) → `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}`.
4. Run `curl -s -i -X DELETE http://localhost:8010/api/notes/99999999999999999999` → `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}`, not a 500.
5. Run `curl -s http://localhost:8010/api/notes` → the list is unchanged from step 1 (a miss deletes nothing).

### Criterion 3: the full backend test suite passes with the new tests included
Prerequisites: on branch `feature/TEST-14-delete-note-by-id`, a PostgreSQL reachable through `DATABASE_URL` (the CLAUDE.md Backing Services recipe, or the compose `db` service on `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`), and `uv` installed.
1. Run `uv run --directory backend pytest -q` → the summary line reports `0 failed` (no failures and no errors) across the whole backend suite, which includes `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py`.
2. Run `uv run --directory backend pytest -q tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py -k delete` → the new delete tests are collected (the count is not zero) and the summary reports `0 failed`.
