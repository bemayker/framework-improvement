# Implementation Plan, FEAT-2: Notes total length endpoint

## Feature
> VERIFY MDF-349: Notes total length endpoint
>
> Add GET /api/notes/total-length to the notes API (backend only).
>
> (The framework Feature ID is FEAT-2; MDF-349 in the tracker title is a staging marker, not an ID. ClickUp task 123k99cxqhp. depends_on: [TEST-12].)

## Acceptance Criteria
- [ ] AC1: with no notes stored, `GET /api/notes/total-length` returns 200 with `{"total_length": 0}`.
- [ ] AC2: after creating notes with bodies "ab" and "cde", it returns `{"total_length": 5}`.
- [ ] AC3: the route does not shadow `GET /api/notes/{id}`; the full backend test suite passes with the new tests included.

## Re-Plan Feedback
No tracker comments: the item carried none when the dispatching session read it (0 comments, 0 threaded replies), and this is a first plan, so there are no PR review comments and no merged-since notice (branch cut from current main 3982641). The assumptions this plan makes in place of a question (`user_story_alignment.md` Section 4, autonomous mode):

1. "Body" means the note's `text` field. The `notes` table, the `Note` model and the HTTP schema have one content field, `text`; there is no field called `body`.
2. `total_length` is the sum of the **character** count of every stored note's `text`, not the byte count. PostgreSQL `char_length(text)`, which counts characters exactly like Python `len(str)`. "café" contributes 4, not 5. Measured on the stored value, which is already whitespace-trimmed by the existing create path, so "ab" and "cde" store as typed and sum to 5.
3. An empty store answers `0`, never `null`: `SUM` over zero rows is SQL `NULL`, so the query wraps it in `COALESCE(..., 0)`.
4. "Does not shadow" is read in both directions, as TEST-15 read it for `/count`: `/api/notes/total-length` must not be captured by `/api/notes/{note_id}` (which would answer 422, since `total-length` fails `int` validation), and `/api/notes/{note_id}` must keep answering 200 / 404 / 422 exactly as before.
5. No query parameters, no filtering, no per-note breakdown, no frontend consumer: none is in the criteria (`user_story_alignment.md` Section 3).

## Plan Overview
One read-only aggregate endpoint on the existing notes slice, following TEST-15's `GET /api/notes/count` exactly: a repository method running one SQL aggregate, a thin service function with failure logging, a one-field response schema, and a router handler declared before `/notes/{note_id}`. Backend only. No migration, no new dependency, no frontend change.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; and this item renders nothing).

## Backend Plan
- Endpoints: `GET /api/notes/total-length`: return the total character length of all stored notes' text. Declared in `backend/app/routers/notes.py` **directly after `GET /api/notes/count` and before `GET /api/notes/{note_id}`**, with the existing precedence comment extended to name both static routes (routes match in declaration order; `{note_id}` would otherwise capture `total-length` and answer 422).
- Service layer: `note_service.total_length(repository) -> int` in `backend/app/services/note_service.py`, same shape as `count_notes`: passes the repository's value through, logs `"Summing note lengths failed"` via `logger.exception` and re-raises on failure. Add `total_length(self) -> int` to `NoteRepositoryProtocol`.
- Repository layer: `NoteRepository.total_length() -> int` in `backend/app/repositories/note_repository.py`, running the module constant `TOTAL_LENGTH_SQL = "SELECT COALESCE(SUM(char_length(text)), 0) FROM notes"` and returning `row[0]`. Update the module docstring's list of statements.
- Schema: `NoteTotalLengthResponse(BaseModel)` with `total_length: int` in `backend/app/schemas/note.py`.
- Migrations: none. The query reads the existing `notes.text` column.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/notes/total-length`
- Request: no body, no query parameters.
- Response: 200, `NoteTotalLengthResponse`. Empty store: `{"total_length": 0}`. After creating "ab" and "cde": `{"total_length": 5}`.
- Errors: none client-facing. A database failure propagates as the app's existing 500 behaviour, logged by the service, identical to `/count`.
- Unchanged by this item: `GET /api/notes/count` still answers `{"count": N}`; `GET /api/notes/{note_id}` still answers 200 with `{"id": 7, "text": "Buy milk"}` for a stored note, 404 with `{"detail": "Note not found"}` on a miss, and 422 on a non-integer segment such as `abc`.

## Technology Selection
- Summing note lengths: chose one SQL aggregate, `COALESCE(SUM(char_length(text)), 0)`, in PostgreSQL (native platform) over fetching every row and summing `len(text)` in Python with the stdlib, because the database already holds the data and a single scalar query does not transfer every note to the API to compute one integer; `char_length` over `octet_length` because the assumption is characters, not bytes.
- Response schema `NoteTotalLengthResponse`: chose a Pydantic `BaseModel`, the installed dependency every notes schema already uses, over a plain `dict` return, so the contract is typed and shows in OpenAPI like `NoteCountResponse`.
- No other net-new component, module or dependency: every other change extends an existing module, and no package is added.

## File Manifest
### New files
- [G] e2e/uat/scripts/FEAT-2_notes-total-length-endpoint_uat_script.md: manual UAT script, expanded from this plan's Manual verification plan
- [G] .claude/artifacts/FEAT-2/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3
- [G] e2e/uat/scenarios/FEAT-2_notes-total-length-endpoint.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/repositories/note_repository.py: add `TOTAL_LENGTH_SQL` and `NoteRepository.total_length() -> int`; update the module docstring
- [B] backend/app/services/note_service.py: add `total_length` to `NoteRepositoryProtocol` and a `total_length(repository) -> int` service function with failure logging
- [B] backend/app/schemas/note.py: add `NoteTotalLengthResponse` with `total_length: int`
- [B] backend/app/routers/notes.py: add `GET /api/notes/total-length` returning `NoteTotalLengthResponse`, declared after `/notes/count` and before `/notes/{note_id}`, extending the precedence comment; update the module docstring
- [B] backend/tests/unit/test_note_service_unit.py: extend `RecordingRepository` and `FailingRepository` with `total_length`; add happy path, empty and failure-logging tests for `note_service.total_length`
- [B] backend/tests/integration/test_notes_integration.py: add repository `total_length` tests and router tests for AC1 to AC3, including the non-shadowing assertions

No E2E spec is produced: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage), so `[D]` has no entries and no `e2e/tests/FEAT-2_*.spec.ts` file is created.
No dependency changes, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` stay untouched).
No `[Docs]` entry: the feature changes no project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `note_service.total_length` with the repository stubbed in memory (`testing_standards.md` Section 1.1, Section 4 unit row).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_note_service_unit.py`)
  - `RecordingRepository.total_length` returns `sum(len(note.text) for note in self.notes)`; `FailingRepository.total_length` raises `RuntimeError("database unreachable")`.
  - Happy path: notes "ab" and "cde" give 5. Edge: no notes give 0 (an int, never None). Error: failure is re-raised and `"Summing note lengths failed"` is in `caplog.text`.
- Integration tests: repository against real PostgreSQL and the router through the full HTTP cycle (Section 1.2), in the existing file using the existing `notes_table` and `client` fixtures.
  - Directory: backend/tests/integration/
  - Repository: `total_length` is 0 on an empty table; "ab" + "cde" inserted gives 5, and deleting the "cde" note gives 2 (follows the data, not a cached value); edge: "café" gives 4 (characters, not bytes; `octet_length` would give 5).
  - Router AC1: empty table, `GET /api/notes/total-length` is 200 with exactly `{"total_length": 0}`.
  - Router AC2: POST "ab" then "cde", then GET is 200 with exactly `{"total_length": 5}`.
  - Router AC3 (non-shadowing, both directions): one test creates a note, then asserts `GET /api/notes/total-length` is 200 with its expected value (not 422, so `{note_id}` did not capture it) **and** `GET /api/notes/{created_id}` is still 200 with `{"id": created_id, "text": ...}`. The existing 404 and 422 tests for `{note_id}` and the `/count` tests stay unchanged and keep passing.
  - Test names follow `test_{method_or_action}_{scenario}_{expected_outcome}` (Section 3), e.g. `test_get_notes_total_length_returns_zero_when_no_notes_exist`.
- E2E tests: not warranted for this feature (no criterion involves UI navigation or interaction; the endpoint has no frontend consumer and the item is backend only). E2E Tests stays ENABLED in CLAUDE.md, but no spec is produced, and the per-feature edge-case spec obligation does not arise because E2E is warranted for no criterion. A browser spec would have to call the API directly, which `testing_standards.md` Section 5 names as a router integration test, not E2E.
  - Directory: e2e/tests/ (nothing added)
- UAT scenarios: ENABLED. One Gherkin scenario per criterion plus the "café" character-count edge case, at the API level, validated for well-formedness by CI (Section 1.4). Plus the manual UAT script, always.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Empty store: `GET /api/notes/total-length` is 200 with `{"total_length": 0}` | Integration (router + repository) and Unit (service, empty case) | Verifying it needs no navigation or interaction: it is an HTTP response of a backend-only endpoint with no UI consumer |
| 2 | After creating "ab" and "cde" it returns `{"total_length": 5}` | Integration (router + repository against PostgreSQL) and Unit (service sum) | Verifying it needs no navigation or interaction: it is a repository aggregate surfaced by a router |
| 3 | The route does not shadow `GET /api/notes/{id}`; the full backend suite passes | Integration (router, both routes in one test) + the whole backend suite executed | Verifying it needs no navigation or interaction: route precedence is an HTTP routing property, and the suite passing is a property of the suite run (`uv run --directory backend pytest -q`, 0 failed) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Empty store returns `{"total_length": 0}` | covered at Integration, see Criterion coverage | Given no notes are stored, When I GET /api/notes/total-length, Then the status is 200 and the body is `{"total_length": 0}` |
| 2 | "ab" + "cde" returns `{"total_length": 5}` | covered at Integration, see Criterion coverage | Given I created notes "ab" and "cde", When I GET /api/notes/total-length, Then the body is `{"total_length": 5}` |
| 3 | No shadowing of `/api/notes/{id}`; suite passes | covered at Integration, see Criterion coverage | Given a note exists, When I GET /api/notes/total-length and GET /api/notes/{its id}, Then both answer 200 with their own bodies |
| edge | Characters, not bytes | covered at Integration | Given only the note "café" is stored, When I GET /api/notes/total-length, Then the body is `{"total_length": 4}` |

## Manual verification plan
This item has no UI: every criterion is verified against the API with `curl`, which is the observable check in place of a click path. Bodies below are written with spaces for readability; `curl` prints them without spaces, which is the same JSON.

### Criterion 1: with no notes stored, GET /api/notes/total-length returns 200 with total_length 0
Prerequisites: the stack is running from the repo root with `docker compose up -d --build`, the backend answers on `http://localhost:8010`.
1. Run `curl -s http://localhost:8010/api/notes` → a JSON array; note every `id` in it.
2. For each id, run `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8010/api/notes/ID` (ID replaced by the id) → `204` each time.
3. Run `curl -s http://localhost:8010/api/notes` → `[]`.
4. Run `curl -s -w "\n%{http_code}\n" http://localhost:8010/api/notes/total-length` → body `{"total_length": 0}` and status `200`.

### Criterion 2: after creating notes with bodies "ab" and "cde", it returns total_length 5
Prerequisites: Criterion 1's steps done, so the store is empty.
1. Create the first note: POST to `http://localhost:8010/api/notes` with header `Content-Type: application/json` and body `{"text": "ab"}` → status 201, the body carries `"text": "ab"` and an integer `id`.
2. Create the second note the same way with body `{"text": "cde"}` → status 201; write down this `id`.
3. Run `curl -s http://localhost:8010/api/notes/total-length` → `{"total_length": 5}`.
4. Delete the "cde" note with `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8010/api/notes/ID` (the id from step 2) → `204`; then repeat step 3 → `{"total_length": 2}`.

### Criterion 3: the route does not shadow GET /api/notes/{id}; the full backend test suite passes
Prerequisites: at least one note stored (the "ab" note from Criterion 2); note its `id` from `curl -s http://localhost:8010/api/notes`.
1. Run `curl -s -w "\n%{http_code}\n" http://localhost:8010/api/notes/total-length` → status `200` with a `total_length` body, never `422` (a 422 would mean `{note_id}` captured the path).
2. Run `curl -s -w "\n%{http_code}\n" http://localhost:8010/api/notes/ID` (the "ab" note's id) → status `200`, body with that `id` and `"text": "ab"`.
3. Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/notes/abc` → `422`, and the same for `http://localhost:8010/api/notes/999999` → `404`, both unchanged.
4. From the repo root, run `uv run --directory backend pytest -q` with the backing database the project declares → `0 failed`; it runs every backend test file including `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py`.
