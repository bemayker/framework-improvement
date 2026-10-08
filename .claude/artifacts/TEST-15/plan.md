# Implementation Plan, TEST-15: Count notes

## Feature
> Add `GET /api/notes/count` to the notes API (backend only).

## Acceptance Criteria
- [ ] AC1: with no notes stored, `GET /api/notes/count` returns 200 with `{"count": 0}`.
- [ ] AC2: after creating two notes, it returns `{"count": 2}`, and after deleting one, `{"count": 1}`.
- [ ] AC3: the route does not shadow `GET /api/notes/{id}`; the full backend test suite passes with the new tests included.

## Re-Plan Feedback
None. The tracker item carries no comments (read 2026-10-08, count 0), this is a fresh plan branched from current main (`e4772f7`), and no `[merged-since]` lines were passed.

Assumptions (recorded rather than blocking, `user_story_alignment.md` Section 4):
1. Only `GET` is added. No other method is defined on `/api/notes/count`; a `DELETE /api/notes/count` keeps falling through to the existing `DELETE /api/notes/{note_id}` route and answers 422, which no criterion asks to change.
2. The count is the total number of rows in `notes`, with no filter, query parameter or caching (no gold plating, `user_story_alignment.md` Section 3).
3. "Does not shadow" is read in both directions: `/api/notes/count` must not be captured by `/api/notes/{note_id}` (which would answer 422, because the path segment `count` fails `int` validation), and `/api/notes/{note_id}` must keep answering 200 / 404 / 422 exactly as before.

## Plan Overview
One read-only endpoint on the existing notes slice, following the established Router to Service to Repository layering: a `COUNT(*)` query in `NoteRepository`, a thin `count_notes` service function with the same failure logging as its siblings, a `NoteCountResponse` schema, and a `GET /notes/count` handler on the existing `/api` router. **The handler is declared before `GET /notes/{note_id}`** in `backend/app/routers/notes.py`: FastAPI (Starlette) matches routes in declaration order, and `{note_id}` is an unconstrained path segment that is only validated as `int` after the match, so declared after it, `/api/notes/count` would be matched by `get_note` and answer 422. No frontend, no migration, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/notes/count`: returns the number of stored notes as `{"count": <int>}`, 200. Declared in `backend/app/routers/notes.py` immediately after `list_notes` and **before** `get_note`, with a one-line comment saying why the order matters (the "why" comment `coding_standards.md` Section 1 asks for).
- Service layer: `note_service.count_notes(repository) -> int`, passing the repository's count through and, on any exception, logging `Counting notes failed` via `logger.exception` and re-raising (same shape as `list_notes`). `NoteRepositoryProtocol` gains `def count_notes(self) -> int: ...`.
- Repository layer: `COUNT_NOTES_SQL = "SELECT COUNT(*) FROM notes"` and `NoteRepository.count_notes() -> int`, returning `row[0]` from `fetchone()`. Module docstring updated to mention the count.
- Schemas: `NoteCountResponse(BaseModel)` with `count: int` in `backend/app/schemas/note.py`.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/notes/count`
- Request: no body, no query parameters.
- Response: 200, `{"count": 2}` (a non-negative integer; `{"count": 0}` on an empty table).
- Unchanged by this item: `GET /api/notes/{note_id}` still answers 200 with `{"id": 7, "text": "Buy milk"}` for a stored note, 404 with `{"detail": "Note not found"}` on a miss, and 422 on a non-integer segment such as `abc`.

## Technology Selection
- Counting stored notes: chose a database aggregate (`SELECT COUNT(*) FROM notes` through the already-installed psycopg) over `len(repository.list_notes())`, because the database answers the count directly instead of the application fetching and materializing every row to measure a list.
- `NoteCountResponse` schema: chose a Pydantic model (already installed via FastAPI) over returning a bare `dict`, because it keeps the response shape in the OpenAPI contract like every other notes response.
- Route precedence: chose declaration order in the existing router over a path-convertor change on `/notes/{note_id}` (`{note_id:int}`), because reordering touches only the new handler while a convertor change would alter how the existing route answers a non-integer id (404 instead of today's 422 with `loc ["path", "note_id"]`, which `test_get_note_by_id_with_non_integer_id_returns_422` asserts).
- No net-new dependency: nothing is installed.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-15_count_notes_uat_script.md: manual UAT script, expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-15/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3
- [G] e2e/uat/scenarios/TEST-15_count_notes.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/repositories/note_repository.py: add `COUNT_NOTES_SQL` and `NoteRepository.count_notes() -> int`; update the module docstring
- [B] backend/app/services/note_service.py: add `count_notes` to `NoteRepositoryProtocol` and a `count_notes(repository) -> int` service function with failure logging
- [B] backend/app/schemas/note.py: add `NoteCountResponse` with `count: int`
- [B] backend/app/routers/notes.py: add `GET /api/notes/count` returning `NoteCountResponse`, declared before `GET /api/notes/{note_id}` with a comment on why; update the module docstring
- [B] backend/tests/unit/test_note_service_unit.py: extend `RecordingRepository` and `FailingRepository` with `count_notes`; add happy path, empty and failure-logging tests for `note_service.count_notes`
- [B] backend/tests/integration/test_notes_integration.py: add repository `count_notes` tests and router tests for AC1 to AC3, including the non-shadowing assertions

No E2E spec is produced: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage), so `[D]` has no entries and no `e2e/tests/TEST-15_*.spec.ts` file is created.
No dependency change, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` are untouched).
No `[Docs]` entry: this feature changes no project structure, run configuration, dependency or test infrastructure, and `README.md` / `docs/DEVELOPMENT.md` list no individual endpoints, so neither needs an edit.

## Testing Strategy
- Unit tests: `note_service.count_notes` with the repository stubbed in memory: returns 2 when two notes are stored (happy path), returns 0 on an empty repository (edge case), logs `Counting notes failed` and re-raises when the repository raises (error case). `RecordingRepository` gains `count_notes` returning `len(self.notes)`; `FailingRepository` gains one that raises `RuntimeError("database unreachable")`. Names follow `testing_standards.md` Section 3, e.g. `test_count_notes_returns_zero_when_none_exist`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_note_service_unit.py` is extended)
- Integration tests: against real PostgreSQL via the existing `notes_table` and `client` fixtures in `backend/tests/conftest.py` (fresh table per test, order-independent):
  - Repository: `count_notes()` returns 0 on an empty table; after two `insert_note` calls it returns 2, and after `delete_note(first.id)` it returns 1.
  - Router AC1: on an empty table `GET /api/notes/count` returns 200 with body exactly `{"count": 0}`.
  - Router AC2: create "Buy milk" and "Walk dog" via `POST /api/notes`, `GET /api/notes/count` returns `{"count": 2}`; `DELETE /api/notes/{buy_milk_id}` returns 204, then `GET /api/notes/count` returns `{"count": 1}`.
  - Router AC3 (non-shadowing, both directions): one test creates a note, then asserts `GET /api/notes/count` is 200 with `{"count": 1}` (not 422, so `{note_id}` did not capture it) **and** `GET /api/notes/{created_id}` is still 200 with `{"id": created_id, "text": "Buy milk"}`. The existing `test_get_note_by_id_returns_404_with_detail_when_id_does_not_exist` and `test_get_note_by_id_with_non_integer_id_returns_422` stay unchanged and keep passing, which covers the 404 and 422 branches of `{note_id}`.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (existing file `test_notes_integration.py` is extended)
- E2E tests: not warranted for this feature (no criterion involves UI navigation or interaction; the endpoint has no frontend consumer and the item is backend only). E2E Tests stays ENABLED in CLAUDE.md, but no spec is produced, and the per-feature edge-case spec obligation does not arise because E2E is warranted for no criterion. A browser spec would have to call the API directly, which `testing_standards.md` Section 5 names as a router integration test, not E2E.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion (AC1 to AC3) plus one edge case (a failed delete of a missing id leaves the count unchanged), phrased against the HTTP API rather than a browser.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Empty table: `GET /api/notes/count` returns 200 with `{"count": 0}` | Integration (router + repository), Unit (service returns 0) | Verifying it needs no navigation or interaction: it is a router/repository behaviour with no UI consumer |
| 2 | Two notes give `{"count": 2}`, deleting one gives `{"count": 1}` | Integration (router + repository), Unit (service passes the count through) | Verifying it needs no navigation or interaction: it is an API sequence (POST, GET, DELETE, GET) with no UI consumer |
| 3 | The route does not shadow `GET /api/notes/{id}`; the full backend suite passes | Integration (router, both routes in one test) + the whole backend suite executed | Verifying it needs no navigation or interaction: route precedence is an HTTP routing property, and the suite passing is a property of the suite run (`uv run --directory backend pytest -q`, 0 failed) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Empty table returns `{"count": 0}` | covered at Integration, see Criterion coverage | Given no notes are stored, When I request `GET /api/notes/count`, Then the status is 200 and the body is `{"count": 0}` |
| 2 | Two notes give 2, one delete gives 1 | covered at Integration, see Criterion coverage | Given I created "Buy milk" and "Walk dog", When I request the count, Then it is 2; When I delete "Buy milk" and request the count, Then it is 1 |
| 3 | No shadowing; suite passes | covered at Integration and the suite run, see Criterion coverage | Given a stored note, When I request `/api/notes/count` and `/api/notes/{its id}`, Then the first is 200 with a count and the second is 200 with that note |
