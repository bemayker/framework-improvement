# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> ## What
>
> `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> ## Acceptance criteria
>
> 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
> 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
> 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
>
> ## Notes
>
> Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422 (FastAPI's standard validation response), not a 500 and not an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422, with the bound declared on the request parameter rather than checked by hand in the handler body.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). ... Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: the precondition is satisfied. The item has since been built, merged and reverted again (latest revert PR #52, commit be81cdf); `origin/main` at b4e8dc5 carries no echo router, no echo schema and no echo tests, verified against the current `backend/app/main.py`, `backend/app/routers/` and `backend/tests/`. This plan is written against main as it now stands, so every file below is genuinely net-new or a genuine modification.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ... No action needed on this item." → Addressed by: criterion 3 is planned exactly as the description states, 422, with the bound declared as `Query(max_length=200)` on the `msg` parameter. This comment is the newest word on the subject and it is what this plan follows.
- Comment (tracker, 2026-09-03, RETRACTED by the comment above): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on: explicitly retracted by the newer 2026-09-03 comment, which names it as a measured-run probe rather than a requirement. Comments are read newest first, so the retraction governs. No 400 path and no `{"error": ...}` body is planned; the endpoint returns FastAPI's standard 422 validation body. Recorded here rather than dropped so a reader can see the contradiction was seen and resolved, not missed.
- Merged since the last plan: not applicable. This is a fresh plan on a branch created from `origin/main` at b4e8dc5, so the merged-since-plan check does not apply and there are no `[merged-since]` lines to reconcile.
- Excluded from this section: the four framework-generated "plan PR opened" link comments (PRs #51, #49, #35, #23). They carry a URL and ask nothing of the plan.

## Plan Overview
One backend endpoint, `GET /api/echo`, built in exactly the shape TEST-02 and TEST-05 established: an `APIRouter` under `backend/app/routers/`, a Pydantic response schema under `backend/app/schemas/`, and one line of registration in the existing `create_app()` factory in `backend/app/main.py`. No service layer, no repository layer, no database, no frontend, no new dependency. The `msg` bound is declared on the query parameter so FastAPI's own request validation produces both 422 cases (missing parameter, over-long parameter) without any branch in the handler. Coverage is unit plus integration; no browser spec is warranted, because no acceptance criterion involves navigation or interaction through a UI.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (`CLAUDE.md` Design Reference mode is NONE). This feature renders no UI at all, so no design values apply.

## Backend Plan
- Endpoints: `GET /api/echo` — returns the `msg` query parameter's value back to the caller, so a client can prove the API is reachable and that query-string handling works end to end. Registered on the existing `/api` prefix, tag `echo`, matching `backend/app/routers/version.py`.
- Service layer: none. Echoing back a value FastAPI has already validated is not business logic, so no module is added under `backend/app/services/`. `coding_standards.md` Section 2.2 scopes the Router → Service → Repository pattern to a backend with data persistence, and Section 1 (KISS) rules out a pass-through service that would only forward its argument. The handler is one return statement constructing the response schema.
- Repository layer: none. The endpoint touches no database and must answer with `DATABASE_URL` unset, exactly as `GET /api/version` does.
- Migrations: none. No schema changes.
- Validation: `msg` is declared as `Annotated[str, Query(max_length=200)]` on the handler signature. Required by omission of a default (criterion 2's 422) and bounded by `max_length` (criterion 3's 422). No length check, no try/except and no manual error construction in the handler body — criterion 3 requires the bound to be declared rather than hand-rolled, and the newest tracker comment names `Query(max_length=...)` as the accepted form.
- Response: `EchoResponse` in `backend/app/schemas/echo.py`, a `pydantic.BaseModel` with one field `echo: str`, declared as the route's `response_model` (criterion 4).
- Error handling: none is written. Both 422 cases are FastAPI's own `RequestValidationError` response, which is the criterion's stated expectation. No custom exception class and no exception handler is added — the app registers none today and this feature needs none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: one required query parameter, `msg` (string, maximum length 200). No request body, no headers beyond the defaults, no authentication.
- Response, 200:

```json
{ "echo": "hello" }
```

- Response, 422 (missing `msg`, or `msg` longer than 200 characters): FastAPI's standard validation body, unchanged and not reshaped:

```json
{ "detail": [ { "type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null } ] }
```

The 422 body's exact `detail` contents are FastAPI's and are deliberately not asserted field-by-field in tests; the contract is the 422 status plus a `detail` key, so a FastAPI version bump does not break the suite on wording.

## Technology Selection
- Length bound on `msg`: chose FastAPI's already-installed `Query(max_length=200)` declarative constraint over a hand-written `if len(msg) > 200` check in the handler, because the installed dependency covers it completely and the declarative form is what criterion 3 requires ("stated in the schema, not enforced by a hand-rolled check").
- Required-parameter enforcement: chose FastAPI's own required-parameter behaviour (no default on the annotated parameter) over an explicit presence check returning an error, because the installed dependency already produces the 422 criterion 2 asks for.
- Response body: chose a Pydantic `BaseModel` (`pydantic`, already installed as a FastAPI dependency) over a bare `dict` return, because criterion 4 requires it and the project's `backend/app/schemas/` convention already exists for exactly this.
- Echo router module: chose a new `APIRouter` file under `backend/app/routers/` over adding the route inline in `backend/app/main.py`, because every existing endpoint in this project uses that shape and the factory in `main.py` is deliberately kept to registration only.
- Service module: not built. No standard-library call, native platform feature or installed dependency is needed, because there is no business logic to place — the alternative considered was a `backend/app/services/echo_service.py` pass-through, rejected as a module that would only forward its argument.
- New dependency: none. `fastapi` and `pydantic` are already installed (`backend/pyproject.toml`), and nothing in this feature needs anything they do not provide.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `EchoResponse` Pydantic model with the single field `echo: str`, the response body criterion 4 mandates.
- [B] backend/app/routers/echo.py: `APIRouter(prefix="/api", tags=["echo"])` with `GET /echo`, `response_model=EchoResponse`, and `msg: Annotated[str, Query(max_length=200)]`.
- [B] backend/tests/unit/test_echo_unit.py: unit tests for the `EchoResponse` schema and for the route's declared contract (response model, and the `maxLength: 200` the generated OpenAPI carries for `msg`).
- [B] backend/tests/integration/test_echo_integration.py: integration tests over the full HTTP cycle — 200 with the echoed value, 422 with no `msg`, 422 at 201 characters, 200 at exactly 200 characters.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge-case scenario (the 200-character boundary).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: the human-readable manual UAT script, expanded from this plan's `## Manual verification plan` with checkboxes, prerequisites and the summary table.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact-directory copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo router and add one `app.include_router(echo_router)` line in `create_app()`; nothing else in the factory changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, matching the per-router registration assertions TEST-02 and TEST-05 already added to this file.

No dependency change: this feature adds no package to `backend/pyproject.toml`, so no lockfile is regenerated and no lockfile entry appears above.

No documentation change: build-feature Section 15's condition is not met. The feature adds one endpoint on the existing router pattern and changes no project structure, no run configuration, no dependency and no test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: the `EchoResponse` schema (happy path: constructs from `echo="hello"` and serializes to `{"echo": "hello"}`; edge case: an empty string is a valid value and round-trips; error case: a missing or non-string `echo` raises `ValidationError`), plus the route's declared contract read off the app built by `create_app()` — the route's `response_model` is `EchoResponse`, and the generated OpenAPI schema for the `msg` query parameter carries `maxLength: 200` and `required: true`. That last assertion is what covers criterion 3's "stated in the schema, not enforced by a hand-rolled check" clause, which no status-code assertion can distinguish.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` → `test_echo_unit.py`
- Integration tests: the full HTTP request/response cycle through the session-scoped `client` fixture in `backend/tests/conftest.py` — `GET /api/echo?msg=hello` returns 200 and exactly `{"echo": "hello"}`; `GET /api/echo` with no parameter returns 422 with a `detail` key; `msg` of 201 characters returns 422; `msg` of exactly 200 characters returns 200 and echoes it back. No database fixture is used: the endpoint needs none and must answer with `DATABASE_URL` unset.
  - Directory: `backend/tests/integration/`
  - Naming: `test_{module}_integration.py` → `test_echo_integration.py`
- E2E tests: none for this feature. `E2E Tests` is ENABLED project-wide and stays enabled; the tier is scoped to criteria whose covering tier is E2E (`testing_standards.md` Section 4's E2E row read with Section 6), and this feature has none — it adds no route, no component and no interactive element to the frontend, so there is nothing a browser could navigate to or interact with. No spec file is produced under `e2e/tests/`.
  - Directory: `e2e/tests/` (unused by this feature)
  - File: `{feature_id}_{slug}.spec.ts` (not produced)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario for the 200-character boundary, validated for well-formedness by CI rather than executed.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | Verifying it needs no navigation and no interaction: it is one router request/response cycle, which the integration tier exercises directly through the test client. No UI renders this value. |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | Verifying it needs no navigation and no interaction: it is a router-level request-validation behaviour, observable as a status code on a single HTTP call. |
| 3 | `msg` longer than 200 characters returns 422, bound declared rather than hand-rolled | Integration | Verifying it needs no navigation and no interaction: the 422 is a router-level validation behaviour at the 200/201-character boundary. The "declared, not hand-rolled" half is additionally asserted at unit level against the generated OpenAPI schema, which no browser test could distinguish anyway. |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit | Verifying it needs no navigation, no interaction and no HTTP cycle: it is a structural property of the code, asserted by importing `EchoResponse` and reading the route's declared `response_model`. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/echo?msg=hello`, Then the response is 200 and the body is `{"echo": "hello"}`. |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/echo` with no `msg` parameter, Then the response is 422 and the body carries a validation `detail`. |
| 3 | `msg` longer than 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/echo` with a `msg` of 201 characters, Then the response is 422. |
| 4 | The response body is defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the built application, When the echo route's declared response model is inspected, Then it is the `EchoResponse` schema from `backend/app/schemas/echo.py` and the 200 body carries exactly the key `echo`. |
| edge | The 200-character boundary is inclusive | covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/echo` with a `msg` of exactly 200 characters, Then the response is 200 and the body echoes all 200 characters. |

## Manual verification plan

This feature has no UI. Every criterion is verified against the HTTP response of `http://localhost:8010/api/echo`, read either in the browser (which renders a JSON response body directly) or with `curl`, which is how the status code is read exactly. Both routes are given per criterion; either one is sufficient.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: the stack is up (`docker compose up -d` from the repository root) and the backend answers on `http://localhost:8010`; confirm with `http://localhost:8010/api/version`, which must render a JSON body containing a `version` key.
1. Open `http://localhost:8010/api/echo?msg=hello` in the browser → the page renders exactly `{"echo":"hello"}` and nothing else.
2. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK` and the body is `{"echo":"hello"}`.
3. Open `http://localhost:8010/api/echo?msg=task%20notes` in the browser → the page renders `{"echo":"task notes"}`, confirming the value is echoed verbatim rather than a fixed string.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: same as criterion 1.
1. Open `http://localhost:8010/api/echo` in the browser, with no query string at all → the page renders a JSON body whose top-level key is `detail`, containing one entry with `"loc": ["query","msg"]` and `"type": "missing"`.
2. In a terminal, run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity`. It must not read 200, and must not read 500.
3. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg="` → the first response line reads `HTTP/1.1 200 OK` and the body is `{"echo":""}`: an empty `msg` is present and therefore valid, which is what distinguishes "missing" from "empty".

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound declared rather than hand-rolled
Prerequisites: same as criterion 1, plus a way to produce a long string. Run `python3 -c "print('a'*201)"` and copy its output; that is the 201-character value used below. Run `python3 -c "print('a'*200)"` for the 200-character value.
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=<the 201-character value>"`, pasting the copied string in place of the placeholder → the first response line reads `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail` entry names `"loc": ["query","msg"]` with a `string_too_long` type mentioning a maximum of 200.
2. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=<the 200-character value>"` → the first response line reads `HTTP/1.1 200 OK` and the body echoes all 200 characters, confirming the boundary is inclusive and the rejection starts at 201.
3. Open `http://localhost:8010/docs` in the browser and expand `GET /api/echo` → the `msg` parameter is shown as required with a maximum length of 200. This is the observable check for the "stated in the schema, not enforced by a hand-rolled check" half of the criterion: a hand-rolled `if` in the handler would produce the same 422 in step 1 but would leave no bound in this generated documentation.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict
This criterion is structural and cannot be fully verified through a running UI; two observable checks stand in for it.
1. Open `http://localhost:8010/openapi.json` in the browser and search for `EchoResponse` → the schema is present under `components.schemas` with a single property `echo` of type `string`, and the 200 response of `/api/echo` references it. A bare dict return would produce no named schema here.
2. Open `backend/app/schemas/echo.py` in the repository → the file exists and defines `class EchoResponse(BaseModel)` with the field `echo: str`, and `backend/app/routers/echo.py` names it as `response_model=EchoResponse` on the route decorator.
