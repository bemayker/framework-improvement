# Implementation Plan, FEAT-3: Notes longest body length endpoint

## Feature
> Add GET /api/notes/longest-length to the notes API (backend only).
>
> AC1: with no notes stored, GET /api/notes/longest-length returns 200 and its max_length field is 0.
> AC2: after creating notes with bodies "ab" and "cde", its max_length field is 3.
> AC3: the route does not shadow GET /api/notes/{id}; the full backend test suite passes with the new tests included.

## Acceptance Criteria
- [ ] AC1: with no notes stored, GET /api/notes/longest-length returns 200 and its max_length field is 0.
- [ ] AC2: after creating notes with bodies "ab" and "cde", its max_length field is 3.
- [ ] AC3: the route does not shadow GET /api/notes/{id}; the full backend test suite passes with the new tests included.

## Re-Plan Feedback
No tracker comments exist on the item (0 read) and there are no PR comments or merged-since lines: this is a fresh plan branched from current main (b1deb5c). Assumptions made instead of questions (autonomous run, `user_story_alignment.md` Section 4):
- Assumption 1: a note's "body" is its stored `text` column (the only content field of `notes`). The feature says body, the schema says text; they are the same thing.
- Assumption 2: "length" is the character count of the stored text, computed by PostgreSQL `char_length(text)` (characters, not bytes), so a multi-byte character such as "é" counts 1. The stored text is already trimmed on create (`note_service.create_note`), so surrounding whitespace never counts.
- Assumption 3: the response body is exactly one field, `max_length`, an integer. No note id, no text, no other statistic (no gold plating, `user_story_alignment.md` Section 3).
- Assumption 4: FEAT-2 (total-length endpoint) is cancelled and none of its code is on main. This plan builds only on what main carries (TEST-03, TEST-12, TEST-14, TEST-15 code in the notes slice) and reuses nothing from the FEAT-2 artifacts directory.

## Plan Overview
One read-only aggregate endpoint in the existing notes slice, following the Router to Service to Repository shape TEST-15 used for `GET /api/notes/count`: a repository method running one aggregate SQL query, a thin service function with failure logging, a response schema, and a static route declared before `GET /api/notes/{note_id}` so `{note_id}` cannot capture `longest-length`. Backend only: no frontend, no migration, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; and this feature has no UI)

## Backend Plan
- Endpoints: `GET /api/notes/longest-length`, returns the character length of the longest stored note text, 0 when no notes exist. Declared in `backend/app/routers/notes.py` after `GET /api/notes/count` and before `GET /api/notes/{note_id}`, with the same why-comment the count route carries (routes match in declaration order; `{note_id}` would capture "longest-length" and answer 422).
- Service layer: `note_service.longest_note_length(repository) -> int` in `backend/app/services/note_service.py`, passing the repository's value through and logging `Reading the longest note length failed` before re-raising on a repository failure, matching the other service functions. `NoteRepositoryProtocol` gains `longest_note_length(self) -> int`.
- Repository layer: `NoteRepository.longest_note_length() -> int` in `backend/app/repositories/note_repository.py`, with a module constant `LONGEST_NOTE_LENGTH_SQL = "SELECT COALESCE(MAX(char_length(text)), 0) FROM notes"`. `MAX` over an empty table is NULL, so the `COALESCE` is what makes AC1 a 0 rather than a null; it is done in SQL so the method always returns an int. Update the module docstring's list of queries.
- Schema: `NoteLongestLengthResponse(BaseModel)` with `max_length: int` in `backend/app/schemas/note.py`.
- Migrations: none. The query reads the existing `notes` table.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/notes/longest-length
- Request: no body, no query parameters
- Response: 200, `application/json`, body `{"max_length": <int>}`. Examples: empty table `{"max_length": 0}`; after notes "ab" and "cde" `{"max_length": 3}`.
- Errors: none specific to this route. A database failure propagates as the app's default 500, as for the other notes routes.
- Unchanged: `GET /api/notes/{note_id}` keeps answering 200 / 404 / 422 exactly as before.

## Technology Selection
- Longest-length computation: chose a database aggregate (`SELECT COALESCE(MAX(char_length(text)), 0) FROM notes`) over loading every note through `list_notes()` and taking Python's `max(len(...), default=0)`, because the database answers in one row without transferring every note body, and it is the same rung TEST-15 took for `COUNT(*)`.
- Data access: chose the installed `psycopg` with raw parameterless SQL, already the repository's convention, over any ORM or query builder; no new dependency.
- Response schema: chose the installed `pydantic` `BaseModel`, as every other schema in `backend/app/schemas/note.py` does; nothing to substitute.
- No new dependency, component or module is introduced: every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scripts/FEAT-3_notes_longest_length_uat_script.md: manual UAT script, expanded from this plan's Manual verification plan
- [G] .claude/artifacts/FEAT-3/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3
- [G] e2e/uat/scenarios/FEAT-3_notes_longest_length.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/repositories/note_repository.py: add `LONGEST_NOTE_LENGTH_SQL` and `NoteRepository.longest_note_length() -> int`; update the module docstring
- [B] backend/app/services/note_service.py: add `longest_note_length` to `NoteRepositoryProtocol` and a `longest_note_length(repository) -> int` service function with failure logging
- [B] backend/app/schemas/note.py: add `NoteLongestLengthResponse` with `max_length: int`
- [B] backend/app/routers/notes.py: add `GET /api/notes/longest-length` returning `NoteLongestLengthResponse`, declared before `GET /api/notes/{note_id}` with a comment on why; update the module docstring
- [B] backend/tests/unit/test_note_service_unit.py: extend `RecordingRepository` and `FailingRepository` with `longest_note_length`; add happy path, empty and failure-logging tests for `note_service.longest_note_length`
- [B] backend/tests/integration/test_notes_integration.py: add repository `longest_note_length` tests and router tests for AC1 to AC3, including the non-shadowing assertions

No E2E spec is produced: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage), so `[D]` has no entries and no `e2e/tests/FEAT-3_*.spec.ts` file is created. No `[A]` entry either: the feature is backend only.
No dependency change, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` are untouched).
No `[Docs]` entry: this feature changes no project structure, run configuration, dependency or test infrastructure, and `README.md` / `docs/DEVELOPMENT.md` list no individual endpoints (checked: neither mentions `/api/notes`), so neither needs an edit.

## Testing Strategy
- Unit tests: `note_service.longest_note_length` with the repository stubbed in memory: returns 3 for stored texts "ab" and "cde" (happy path), returns 0 on an empty repository (edge case), logs `Reading the longest note length failed` and re-raises when the repository raises (error case). `RecordingRepository.longest_note_length` returns `max((len(note.text) for note in self.notes), default=0)`; `FailingRepository` raises `RuntimeError("database unreachable")`. Names follow `testing_standards.md` Section 3, e.g. `test_longest_note_length_returns_zero_when_none_exist`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend the existing test_note_service_unit.py)
- Integration tests (ENABLED): repository against real PostgreSQL via the `notes_table` fixture: 0 on an empty table; 3 after inserting "ab" and "cde"; character not byte count (insert "éé" and "abc", expect 3, which a byte-length `length()`/`octet_length` mistake would answer 4). Router through `client`: AC1 empty table answers 200 with exactly `{"max_length": 0}`; AC2 after POSTing "ab" and "cde" answers `{"max_length": 3}`; AC3 after creating a note, `GET /api/notes/longest-length` answers 200 (not 422) and `GET /api/notes/{id}` for the created note still answers 200 with that note, and a non-integer id such as `/api/notes/abc` still answers 422 on `note_id`.
  - Directory: backend/tests/integration/
- E2E tests: ENABLED in CLAUDE.md but not warranted: no criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, asked per criterion below). No spec file.
- UAT scenarios: ENABLED. One Gherkin scenario per criterion plus one edge case (the multi-byte character count), in e2e/uat/scenarios/, phrased as API calls since there is no UI.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Empty table: 200 and max_length 0 | Integration | verifying it needs no navigation or interaction: it is a router plus repository behaviour on an empty table, and no UI shows it |
| 2 | Notes "ab" and "cde": max_length 3 | Integration (plus Unit for the service pass-through) | verifying it needs no navigation or interaction: it is an aggregate query answered through HTTP, with no UI surface |
| 3 | No shadowing of GET /api/notes/{id}; full backend suite passes | Integration (plus the full backend suite run) | verifying it needs no navigation or interaction: route matching order is a router behaviour, and the suite run is the test gate command |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Empty table: 200 and max_length 0 | covered at Integration, see Criterion coverage | Given no notes are stored, When I GET /api/notes/longest-length, Then the status is 200 and max_length is 0 |
| 2 | Notes "ab" and "cde": max_length 3 | covered at Integration, see Criterion coverage | Given notes "ab" and "cde" were created, When I GET /api/notes/longest-length, Then max_length is 3 |
| 3 | No shadowing; full suite passes | covered at Integration, see Criterion coverage | Given a note exists, When I GET /api/notes/longest-length and GET /api/notes/{its id}, Then both answer 200 with their own bodies |

## Manual verification plan
This feature has no UI: every criterion is an API behaviour, so it is verified with HTTP calls from a terminal (or the FastAPI docs page at http://localhost:8010/docs, "Try it out"), not by clicking through the app. Each `curl -i` below prints the status line first and the JSON body last; curl prints JSON without spaces, the plan writes it spaced.

### Criterion 1: with no notes stored, GET /api/notes/longest-length returns 200 and its max_length field is 0
Prerequisites: the stack is running (`docker compose up -d --build` from the repo root), the backend answers at http://localhost:8010.
1. Run `curl -s http://localhost:8010/api/notes` → a JSON list; note every `id` in it (it may be `[]` already).
2. For each id from step 1, run `curl -i -X DELETE http://localhost:8010/api/notes/<id>` → status line `HTTP/1.1 204 No Content` for each.
3. Run `curl -s http://localhost:8010/api/notes` → `[]`.
4. Run `curl -i http://localhost:8010/api/notes/longest-length` → status line `HTTP/1.1 200 OK` and body `{"max_length": 0}`.

### Criterion 2: after creating notes with bodies "ab" and "cde", its max_length field is 3
Prerequisites: Criterion 1 just ran, so the notes table is empty.
1. Run `curl -i -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" --data-binary @-` and type the line `{"text": "ab"}` then Ctrl-D → `HTTP/1.1 201 Created`, body with text `ab` and a numeric `id`.
2. Repeat step 1 with the line `{"text": "cde"}` → `201`, body with text `cde` and a larger `id`; write that id down as CDE_ID.
3. Run `curl -i http://localhost:8010/api/notes/longest-length` → `HTTP/1.1 200 OK` and body `{"max_length": 3}`.

### Criterion 3: the route does not shadow GET /api/notes/{id}; the full backend test suite passes with the new tests included
Prerequisites: Criterion 2 just ran, CDE_ID is known.
1. Run `curl -i http://localhost:8010/api/notes/longest-length` → `HTTP/1.1 200 OK` and body `{"max_length": 3}`, never a 422 that names `note_id`.
2. Run `curl -i http://localhost:8010/api/notes/<CDE_ID>` → `HTTP/1.1 200 OK` and a body with that id and text `cde`.
3. Run `curl -i http://localhost:8010/api/notes/abc` → `HTTP/1.1 422 Unprocessable Entity`, whose detail names the path parameter `note_id` (unchanged behaviour).
4. With a PostgreSQL reachable for the integration tests, run the test gate command from the repo root: `uv run --directory backend pytest -q && npm --prefix frontend test` → pytest reports `0 failed` (it runs backend/tests/unit/test_note_service_unit.py and backend/tests/integration/test_notes_integration.py with the rest of the suite), and Vitest reports `0 failed`.
