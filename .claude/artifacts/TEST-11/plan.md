# Implementation Plan, TEST-11: Echo endpoint trims surrounding whitespace

## Feature
> A small backend change staged 2026-10-03 for sitting 3 of the 0.3.250 release run (row 51: `/revise-feature` on a PR with no review comments, first while it is MERGEABLE, then after main is moved so it CONFLICTS).
>
> **What:** `GET /api/echo` returns the message with surrounding whitespace removed.
>
> **Acceptance criteria**
> 1. `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`.
> 2. A message that is only whitespace returns `{"echo": ""}`.
> 3. The 200-character limit still applies to the message as sent, before trimming.
> 4. Unit and integration tests cover criteria 1 to 3.
>
> **Notes:** Backend only, `backend/app/routers/echo.py` and its tests. TEST-06 is complete. Depends on: TEST-06.

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`.
- [ ] 2. A message that is only whitespace returns `{"echo": ""}`.
- [ ] 3. The 200-character limit still applies to the message as sent, before trimming.
- [ ] 4. Unit and integration tests cover criteria 1 to 3.

## Re-Plan Feedback (if applicable)
No actionable feedback. The item carries 1 tracker comment (0 threaded replies): a framework-written link to an earlier plan PR (#78) from a sandbox sitting that has since been reset. It asks for nothing and contradicts nothing in the description, so it is recorded here and not acted on. No PR review comments (first plan, no PR on this branch). Merged-since check: n/a (fresh plan, branched from current main at b9e62eb). History noted: an earlier TEST-11 implementation (#78) was reverted by the sandbox reset (#83); main's `backend/app/routers/echo.py` returns `msg` unchanged (TEST-06, #88), so this plan treats the item as unimplemented.

Assumptions recorded (no blocking question, `user_story_alignment.md` Section 4):
1. "Whitespace" means what Python's `str.strip()` with no argument removes (spaces, tabs, newlines, carriage returns and other Unicode whitespace), not only the ASCII space. Criterion 1 uses spaces only; the wider definition is the ordinary reading of "whitespace" and needs no extra code.
2. Only surrounding whitespace is removed; interior whitespace is kept (`"  hello world  "` echoes `"hello world"`), per "surrounding" in the What line.
3. The trim stays in the router handler, as a single expression, rather than in a new service module. TEST-06 established the echo endpoint with no service layer and no persistence, the architecture note says to keep every feature as small as possible, and the item's own Notes scope the change to `backend/app/routers/echo.py`. A one-expression input normalisation is not the business logic `coding_standards/backend_frontend.md` Section 2.2 keeps out of routers; a reviewer who disagrees should raise it on this plan PR, where moving it is still cheap.

## Plan Overview
Backend-only, one-line behaviour change to the existing `GET /api/echo` router from TEST-06: the handler returns `EchoResponse(echo=msg.strip())` instead of `EchoResponse(echo=msg)`. The 200-character bound stays exactly where it is, declared on the query parameter (`Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`), which FastAPI enforces on the decoded value as sent, before the handler runs, so criterion 3 holds by construction and is pinned by tests rather than by new code. The existing unit test that asserts the input comes back unchanged is rewritten to assert the trim; new unit and integration tests cover criteria 1 to 3. No schema, frontend, database, dependency or external-API change. UAT artifacts (Gherkin scenarios, manual script and its artifact copy) are produced as build-feature requires.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo` (existing, TEST-06): behaviour change only, the returned `echo` is the decoded `msg` with surrounding whitespace removed.
- Router: `backend/app/routers/echo.py`, `get_echo` returns `EchoResponse(echo=msg.strip())`; the docstring changes from "Return the given text unchanged" to say the text comes back with surrounding whitespace removed, and that the length bound applies to the value as sent, before trimming (that ordering is the reason the bound stays on the parameter and no length check is added after the strip). Module docstring names TEST-11 beside TEST-06.
- Service layer: none (see assumption 3).
- Repository layer: none, no persistence.
- Schemas: `backend/app/schemas/echo.py` unchanged (`EchoResponse` with `echo: str`, `MAX_ECHO_MESSAGE_LENGTH = 200`).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg` (string, required, at most 200 characters as sent, after URL decoding and before trimming).
- Response 200: `{"echo": "<msg with leading and trailing whitespace removed>"}`
  - `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`
  - `GET /api/echo?msg=%20%20%20` returns `{"echo": ""}`
  - `GET /api/echo?msg=hello%20world` returns `{"echo": "hello world"}` (interior space kept)
- Response 422 (unchanged from TEST-06): `msg` missing, or `msg` longer than 200 characters as sent (`detail[0].type` is `string_too_long`, `detail[0].loc` is `["query", "msg"]`), including a value that would be 200 characters or fewer after trimming.

## Technology Selection
- Whitespace trimming: chose the standard library's `str.strip()` over a regular expression (`re.sub`) or a hand-written loop, because `str.strip()` removes exactly leading and trailing whitespace in one call and covers the need entirely.
- Length bound before trimming: no new component; the existing declarative `Query(max_length=...)` from TEST-06 already validates the value as sent, before the handler runs, so it is kept rather than replaced by a handler-side check.
- No other net-new component, module or dependency is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-11_echo_trims_whitespace.feature: Gherkin scenarios, one per acceptance criterion 1 to 3 plus one edge case (interior whitespace is kept while surrounding whitespace is removed); criterion 4 is a property of the test suite and gets no scenario of its own.
- [G] e2e/uat/scripts/TEST-11_echo_trims_whitespace_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-11/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/routers/echo.py: `get_echo` returns `EchoResponse(echo=msg.strip())`; handler and module docstrings updated to state the trim and that the 200-character bound applies to the value as sent, before trimming. The `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)` declaration is unchanged.
- [B] backend/tests/unit/test_echo_unit.py: replace `test_get_echo_returns_echo_response_with_input_unchanged` (it asserts the old behaviour) with `test_get_echo_with_surrounding_spaces_returns_trimmed_message` (criterion 1: `"  hello  "` gives `"hello"`); add `test_get_echo_with_only_whitespace_returns_empty_echo` (criterion 2: `"   "` and `" \t\n "` give `""`); add `test_get_echo_keeps_interior_whitespace` (edge: `"  hello world  "` gives `"hello world"`); add `test_get_echo_msg_bound_is_declared_on_the_parameter` (criterion 3: the `Annotated` metadata of `get_echo`'s `msg` parameter carries a max length equal to `MAX_ECHO_MESSAGE_LENGTH`, so the bound is enforced on the value as sent, before the handler trims). Existing schema, bound-constant, empty-string and error-case tests stay.
- [B] backend/tests/integration/test_echo_integration.py: add `test_get_echo_with_surrounding_spaces_returns_trimmed_message` (criterion 1, the literal URL `/api/echo?msg=%20%20hello%20%20` gives 200 and `{"echo": "hello"}`); `test_get_echo_with_only_whitespace_returns_empty_echo` (criterion 2, `msg=%20%20%20` gives 200 and `{"echo": ""}`); `test_get_echo_over_max_length_before_trimming_returns_422` (criterion 3, one space plus 199 `a` plus one space is 201 characters as sent and 199 after trimming, and is rejected with 422 `string_too_long` at loc `query`/`msg`); `test_get_echo_at_max_length_with_padding_returns_trimmed_200` (criterion 3 boundary, two spaces plus 196 `a` plus two spaces is exactly 200 as sent, gives 200 and 196 `a`). Existing TEST-06 tests stay unchanged and still pass (their inputs carry no surrounding whitespace).

No dependency changes, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` are untouched). No `[Docs]` entries: the change alters one endpoint's output and touches no project structure, run configuration, dependencies or test infrastructure, so build-feature Section 15's condition for `README.md` / `docs/DEVELOPMENT.md` is not met. No `[D]` entries: no acceptance criterion's covering tier is E2E (see Criterion coverage), so no spec under `e2e/tests/` is written.

## Testing Strategy
- Unit tests: `get_echo` called as a plain function for the trim (criteria 1 and 2, interior-whitespace edge case) and the declared bound on its `msg` parameter (criterion 3). Names follow `test_{method_or_action}_{scenario}_{expected_outcome}` (`testing_standards.md` Section 3). The handler has no error path of its own; the error case for this unit stays the existing `EchoResponse()` without `echo` raising `ValidationError`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, existing `test_echo_unit.py`
- Integration tests: the router through the real HTTP request/response cycle with the session-scoped `client` fixture from `backend/tests/conftest.py`: criterion 1's literal URL, the whitespace-only 200, and the bound measured on the value as sent (201 padded rejected, 200 padded accepted and trimmed). No database is touched, so no backing service is needed for these tests.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, existing `test_echo_integration.py`
- E2E tests: enabled per CLAUDE.md but not warranted for this feature: the frontend never calls `/api/echo` (no reference under `frontend/src` or `e2e/tests`), and no criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion). An E2E test calling the API directly is a router integration test by definition (`testing_standards.md` Section 5), which the integration tier already covers. The per-feature E2E edge-case obligation applies only where E2E is warranted at all, so no spec is written.
  - Directory: e2e/tests/ (not used)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion 1 to 3 plus the interior-whitespace edge case, and the manual UAT script expanded from the Manual verification plan.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}` | Integration (plus Unit on the handler) | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | A whitespace-only message returns `{"echo": ""}` | Integration (plus Unit on the handler) | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 3 | The 200-character limit applies to the message as sent, before trimming | Integration (plus Unit on the declared bound) | verifying it needs no navigation or interaction: it is declarative query validation, asserted at the 200/201 boundary over HTTP with padded values |
| 4 | Unit and integration tests cover criteria 1 to 3 | Unit and Integration | verifying it needs no navigation or interaction: it is a property of the test suite, met by the unit and integration tests above and checked by the reviewer against the diff |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `/api/echo?msg=%20%20hello%20%20`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | A whitespace-only message returns `{"echo": ""}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `/api/echo?msg=%20%20%20`, Then the status is 200 and the body is `{"echo": ""}` |
| 3 | The 200-character limit applies to the message as sent, before trimming | covered at Integration, see Criterion coverage | Given the backend is running, When I request `/api/echo` with a 201-character `msg` of one space, 199 `a` and one space, Then the status is 422; and When the `msg` is two spaces, 196 `a` and two spaces (200 as sent), Then the status is 200 and the echo is the 196 `a` |
| 4 | Unit and integration tests cover criteria 1 to 3 | covered at Unit and Integration, see Criterion coverage | not a UAT scenario: it is a property of the test suite, verified by running it (see Manual verification plan) |
| edge | Interior whitespace is kept | covered at Integration and Unit | Given the backend is running, When I request `/api/echo?msg=%20%20hello%20world%20%20`, Then the body is `{"echo": "hello world"}` |

## Manual verification plan
This feature has no screen in the app and the frontend never calls `/api/echo`, so every check runs against the backend directly with `curl` in a terminal; the observable result is the HTTP status line and the JSON body. `curl` prints the body without spaces after the colon, so `{"echo": "hello"}` below appears on screen as the same JSON with no space.

### Criterion 1: `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`
Prerequisites: the stack is up (`docker compose up -d` at the repository root) and the backend answers on http://localhost:8010 (`curl -s http://localhost:8010/api/version` prints a body with a `version` value).
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=%20%20hello%20%20"` → the first line shows status `200` and the body is `{"echo": "hello"}`, with no leading or trailing spaces inside the quotes.
2. Run `curl -s "http://localhost:8010/api/echo?msg=%20%20hello%20world%20%20"` → the body is `{"echo": "hello world"}`: the space between the words is kept, only the outer spaces are gone.
3. Run `curl -s "http://localhost:8010/api/echo?msg=hello"` → the body is `{"echo": "hello"}` (a message with nothing to trim is unchanged).

### Criterion 2: a message that is only whitespace returns `{"echo": ""}`
Prerequisites: as Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo?msg=%20%20%20"` (three spaces) → status `200` and the body is `{"echo": ""}`.
2. Run `curl -s "http://localhost:8010/api/echo?msg=%20%09%0A%20"` (space, tab, newline, space) → the body is `{"echo": ""}`.

### Criterion 3: the 200-character limit applies to the message as sent, before trimming
Prerequisites: as Criterion 1, plus `python3` on the PATH to build the long values.
1. Run `python3 -c "print('http://localhost:8010/api/echo?msg=%20' + 'a' * 199 + '%20')"` and copy the URL it prints (one space, 199 `a`, one space: 201 characters as sent, 199 after trimming).
2. Run `curl -i "<the URL from step 1>"` → status `422` (not `200`), and the body's `detail` entry has `"type": "string_too_long"` and `"loc": ["query", "msg"]`. The message is rejected even though it would fit after trimming.
3. Run `python3 -c "print('http://localhost:8010/api/echo?msg=%20%20' + 'a' * 196 + '%20%20')"` and copy the URL (two spaces, 196 `a`, two spaces: exactly 200 characters as sent).
4. Run `curl -s "<the URL from step 3>"` → status `200` and the body is `{"echo": "aaa…a"}` holding exactly 196 `a` and no spaces (check with `curl -s "<URL>" | python3 -c "import json,sys; print(len(json.load(sys.stdin)['echo']))"`, which prints `196`).

### Criterion 4: unit and integration tests cover criteria 1 to 3
Not verifiable through any UI: it is a property of the test suite. Observable check:
1. Open `backend/tests/unit/test_echo_unit.py` and `backend/tests/integration/test_echo_integration.py` on the PR → each criterion 1 to 3 has at least one test whose docstring names it (the test names are listed in this plan's File Manifest).
2. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py` from the repository root → the summary line reports all collected tests passed and 0 failed.
