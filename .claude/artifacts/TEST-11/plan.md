# Implementation Plan, TEST-11: Echo endpoint trims surrounding whitespace

## Feature
> A small backend change staged 2026-10-03 for sitting 3 of the 0.3.250 release run (row 51: `/revise-feature` on a PR with no review comments, first while it is MERGEABLE, then after main is moved so it CONFLICTS).
>
> ## What
>
> `GET /api/echo` returns the message with surrounding whitespace removed.
>
> ## Acceptance criteria
>
> 1. `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`.
> 2. A message that is only whitespace returns `{"echo": ""}`.
> 3. The 200-character limit still applies to the message as sent, before trimming.
> 4. Unit and integration tests cover criteria 1 to 3.
>
> ## Notes
>
> Backend only, `backend/app/routers/echo.py` and its tests. TEST-06 is complete.
>
> Depends on: TEST-06.

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`.
- [ ] 2. A message that is only whitespace returns `{"echo": ""}`.
- [ ] 3. The 200-character limit still applies to the message as sent, before trimming.
- [ ] 4. Unit and integration tests cover criteria 1 to 3.

## Plan Overview
A one-line backend change to TEST-06's echo handler: `get_echo` in `backend/app/routers/echo.py` returns `EchoResponse(echo=msg.strip())` instead of the message unchanged. Nothing else in the request path moves.

**Where the trim lives: in the handler, after validation, not in the schema.** The 200-character bound stays exactly where TEST-06 put it, as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the `EchoMessage` annotated type in `backend/app/schemas/echo.py`, so FastAPI's request validation checks the length of the message **as sent** and returns its standard 422 before the handler runs. The handler then trims a value that has already passed validation, which is what criterion 3 requires by construction. Putting the trim in the schema instead (an `AfterValidator(str.strip)` on `EchoMessage`) was considered and rejected: it would make the order of length check versus trim depend on pydantic's constraint-then-validator ordering, an implicit rule a reader has to know, where the handler placement makes the order visible in the source. `backend/app/schemas/echo.py` is therefore unchanged.

Layers touched: router only. No service layer is introduced: the change is a single standard-library call with no persistence, and the endpoint has never had a service (TEST-06), so adding one would be gold plating (`user_story_alignment.md` Section 3; `CLAUDE.md` Architecture Notes: keep every feature as small as possible). No frontend, no database, no migration, no external API, no new dependency.

**Assumption recorded (no blocking question):** "whitespace" means what Python's `str.strip()` with no argument removes: spaces, tabs, newlines, carriage returns and the other Unicode whitespace characters. Only leading and trailing whitespace is removed; inner whitespace (`hello  world`) is preserved, because the criteria say "surrounding". The 422 for a missing `msg` (TEST-06 criterion 2) is unchanged; an empty `msg=` already returned `{"echo": ""}` and still does.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature has no UI).

## Backend Plan
- Endpoints: `GET /api/echo` (existing, TEST-06): now returns the `msg` query value with leading and trailing whitespace removed.
- Router: `get_echo(msg: EchoMessage) -> EchoResponse` returns `EchoResponse(echo=msg.strip())`; docstring updated to say the message comes back trimmed. The handler gains no length check: the bound stays declared once, in the schema.
- Schemas: unchanged. `ECHO_MSG_MAX_LENGTH = 200` and `EchoMessage = Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]` keep validating the untrimmed value.
- Service layer: none (see Plan Overview).
- Repository layer: none; the endpoint uses no database.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg` (string, required, at most 200 characters **as sent, before trimming**).
- Response 200: `EchoResponse`, the message with surrounding whitespace removed, e.g. `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`, and `GET /api/echo?msg=%20%20%20` returns `{"echo": ""}`.
- Response 422 (unchanged): missing `msg` gives `detail[0].type == "missing"`; a `msg` longer than 200 characters as sent gives `detail[0].type == "string_too_long"` with `loc == ["query", "msg"]`, even when the trimmed value would be 200 characters or fewer.

## Technology Selection
- Trimming: chose the standard library's `str.strip()` in the existing handler over a pydantic `AfterValidator` on the schema type and over any hand-written loop or regex, because the stdlib call covers the need in one expression and the handler placement keeps validate-then-trim visibly ordered.
- No other net-new component, module or dependency is introduced: no new file in application code, no new package, no lockfile change.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-11_echo_trims_whitespace.feature: Gherkin scenarios, one per acceptance criterion plus the edge case that inner whitespace is preserved.
- [G] e2e/uat/scripts/TEST-11_echo_trims_whitespace_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-11/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/routers/echo.py: `get_echo` returns `EchoResponse(echo=msg.strip())`; docstring updated to "Return the given message with surrounding whitespace removed." No other line changes.
- [B] backend/tests/unit/test_echo_unit.py: add unit tests calling `get_echo` directly (no HTTP, no app): surrounding spaces removed (`"  hello  "` gives `echo == "hello"`), whitespace-only (`"   "` and `"\t\n "`) gives `echo == ""`, mixed tabs and newlines around text with inner spaces preserved (`"\t hello  world \n"` gives `"hello  world"`), and an already-trimmed message returned unchanged. Existing schema tests stay as they are.
- [B] backend/tests/integration/test_echo_integration.py: add HTTP-cycle tests through the shared `client` fixture: `msg="  hello  "` returns 200 and the body `{"echo": "hello"}`; `msg="   "` returns 200 and `{"echo": ""}`; a 201-character message as sent (`" " + "a" * 199 + " "`, 199 characters once trimmed) returns 422 with `detail[0].type == "string_too_long"` and `loc == ["query", "msg"]`; a 200-character message as sent (`" " + "a" * 198 + " "`) returns 200 with the trimmed 198-character echo. Existing TEST-06 tests remain and must still pass unchanged.

`backend/app/schemas/echo.py` and `backend/app/main.py` are not modified: the bound stays in the schema and the router is already registered. No dependency manifest changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the router handler `get_echo` called as a plain function with the trimming cases above; it has no external dependency, so nothing is mocked. Cases cover happy path (surrounding spaces), edge cases (whitespace-only, tabs/newlines, inner whitespace kept, already-trimmed input).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so the existing `test_echo_unit.py`; names follow `test_{method_or_action}_{scenario}_{expected_outcome}`, e.g. `test_get_echo_with_surrounding_spaces_returns_trimmed_message`.
- Integration tests: router layer through the real HTTP request/response cycle (`fastapi.testclient.TestClient`, session-scoped `client` fixture from `backend/tests/conftest.py`), cases listed in the File Manifest. The endpoint uses no database, so no `DATABASE_URL` and no DB fixtures are needed.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, so the existing `test_echo_integration.py`.
- E2E tests: none for this feature. E2E is ENABLED, but no acceptance criterion involves navigation or interaction through the UI: there is no frontend change and no page consumes `/api/echo`. An E2E test that calls the API directly is a router integration test (`testing_standards.md` Section 5), so every criterion is covered at unit and/or integration level and no `e2e/tests/` spec is produced.
  - Directory: e2e/tests/ (unused for this feature)
  - File: none (would be `TEST-11_echo_trims_whitespace.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the inner-whitespace edge case, written as HTTP request/response steps (validated for well-formedness only), matching TEST-06's scenarios file.
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}` | Unit + Integration | No UI consumes the endpoint; it is a handler transformation (unit) observable as an HTTP response body (integration), with nothing to navigate or click |
| 2 | A whitespace-only message returns `{"echo": ""}` | Unit + Integration | Same handler transformation on a whitespace-only input; verified on the function and on the HTTP response, no UI path exists |
| 3 | The 200-character limit applies to the message as sent, before trimming | Integration | It is FastAPI request validation, which runs only in the HTTP cycle; both sides of the boundary with padding (200 and 201 characters as sent) are asserted at router level |
| 4 | Unit and integration tests cover criteria 1 to 3 | Unit + Integration | It is a criterion about the test suite itself, satisfied by the unit and integration tests listed above; there is nothing to click |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Surrounding spaces removed | covered at Unit + Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo?msg=%20%20hello%20%20, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | Whitespace-only message gives empty echo | covered at Unit + Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo?msg=%20%20%20, Then the status is 200 and the body is `{"echo": ""}` |
| 3 | Limit applies before trimming | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends a msg of 201 characters as sent (1 space, 199 letters, 1 space), Then the status is 422 with type "string_too_long" |
| 4 | Unit and integration tests cover 1 to 3 | covered at Unit + Integration, see Criterion coverage | Given the repository, When the backend test suite runs, Then the TEST-11 unit and integration tests pass |

## Manual verification plan
This feature has no UI: no page calls `/api/echo`, so each criterion is verified with an HTTP request from a terminal and its observable check is the status code and the exact response body. Run every command from the repository root.

### Criterion 1: `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`
Prerequisites: the stack is running with `docker compose up -d --build`, and the backend answers at `http://localhost:8010` (the port TEST-06's UAT used).
1. In a terminal, run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%20%20hello%20%20'` → the output is `{"echo":"hello"} 200`: no spaces before or after `hello`.
2. Run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%09hello%20%20world%0A'` → the output is `{"echo":"hello  world"} 200`: the tab and newline around the text are gone and the two inner spaces are kept.

### Criterion 2: a message that is only whitespace returns `{"echo": ""}`
Prerequisites: as for Criterion 1.
1. Run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%20%20%20'` → the output is `{"echo":""} 200`.
2. Run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%09%0A%20'` (a tab, a newline and a space) → the output is `{"echo":""} 200`.

### Criterion 3: the 200-character limit applies to the message as sent, before trimming
Prerequisites: as for Criterion 1.
1. Run `printf ' %0199d ' 0 > /tmp/test11_msg201.txt` → the file holds 201 characters: a space, 199 zeros, a space (check with `wc -c /tmp/test11_msg201.txt`, which prints `201`).
2. Run `curl -s -w ' %{http_code}' -G --data-urlencode msg@/tmp/test11_msg201.txt http://localhost:8010/api/echo` → the status at the end is `422`, and the body's first `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]`, even though the message would be 199 characters once trimmed.
3. Run `printf ' %0198d ' 0 > /tmp/test11_msg200.txt`, then `curl -s -w ' %{http_code}' -G --data-urlencode msg@/tmp/test11_msg200.txt http://localhost:8010/api/echo` → the status is `200` and the body is `{"echo":"000…0"}` with exactly 198 zeros and no surrounding spaces.

### Criterion 4: unit and integration tests cover criteria 1 to 3
Not verifiable through any UI; the observable check is the test run.
1. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py` → every test passes, including the new trimming tests named after criteria 1 to 3 (surrounding spaces, whitespace-only, 201 and 200 characters as sent), with no failures and no skips.
