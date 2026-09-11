# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> **What**
>
> `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> **Acceptance criteria**
>
> 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
> 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
> 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
>
> **Notes**
>
> Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.
>
> Tracker: ClickUp task 123k99ctgcf, list "Validation sandbox"; branch `feature/TEST-06-echo-endpoint`; depends_on: TEST-01; scaffold: no.

## Acceptance Criteria
- [ ] `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] `GET /api/echo` with no `msg` returns 422, FastAPI's standard validation response (a `detail` list naming `["query", "msg"]`), never a 500 or an empty 200.
- [ ] `msg` longer than 200 characters returns 422, with the bound declared as parameter metadata (`Query(max_length=200)`, the constant living in the schema module), not as a `len()` check in the handler.
- [ ] The response body is defined by a Pydantic schema, `EchoResponse` in `backend/app/schemas/echo.py`, and the router returns that model rather than a bare dict.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07, newest): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). It is the Arm C item again because playbook Section 4 step 3 requires the same item both times. Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: the gate is satisfied. The dispatching session verified that `0ac6818 chore: revert TEST-06, TEST-07 and TEST-08 for measured run 3 (#29)` is on `origin/main`, and this planner confirmed from the checkout (cut from current `origin/main`) that `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, `backend/app/schemas/` only `health.py`, `note.py` and `version.py`, and no test, spec or UAT file mentions an echo endpoint. The feature is net-new on main as it now stands and this plan is written against that main. Nothing from the run-2 implementation is reused or assumed.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. The 400-instead-of-422 comment above was posted deliberately on 2026-09-03 to test whether a re-plan absorbs a tracker comment that contradicts an accepted criterion. It is withdrawn. Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via `Query(max_length=...)` rather than checked in the handler." → Addressed by: criterion 3 is planned exactly as the description states it, 422 with the bound on `Query(max_length=...)`. This comment also settles where the bound is declared, so the plan's API Contract and Backend Plan name `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)` as the mechanism.
- Comment (tracker, 2026-09-03, retracted by the comment above): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer 2026-09-03 comment withdraws it explicitly and reinstates criterion 3 as written. Newest comment wins; no 400 path and no custom error body are planned.
- Comment (tracker, older): the framework's own plan-PR link comment from the previous run (the PR URL of the run-2 plan PR). → Not acted on because it carries no planning content; recorded so no comment is silently dropped. The dispatching session dedupes the link comment on the PR URL, so this plan's PR gets its own.
- Merged since the last plan: n/a. This is a fresh plan on a branch cut from current `origin/main`; there is no earlier plan on this branch to reconcile.

## Plan Overview
Backend-only feature. Add `GET /api/echo` to the FastAPI app as one router (`backend/app/routers/echo.py`) and one response schema (`backend/app/schemas/echo.py`), registered in `create_app()` in `backend/app/main.py` exactly as the version and health routers are. The router declares `msg` as a required query parameter with `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)` and returns `EchoResponse(echo=msg)`. FastAPI's own request validation produces the 422 for both a missing `msg` (criterion 2) and an over-long one (criterion 3); no validation code is written in the handler. The response model is `EchoResponse` (criterion 4). No frontend work, no service or repository module, no migration, no new dependency.

Deliberate deviation from `coding_standards.md` Section 2.2, recorded here so the reviewer reads it as planned: no `backend/app/services/echo_service.py` is created. Section 2.2's Router → Service → Repository pattern is for business logic and transactional boundaries; echoing a validated string into a response model is neither, and the feature text bounds the scope to "one router, one schema, its tests". A service module would be a one-line pass-through with nothing to test in isolation, which is the gold plating `user_story_alignment.md` Section 3 forbids. The existing routers keep a service only where there is logic to hold (version resolution, the database probe), so the local precedent is consistent with this. The router still carries no business logic, which is the Section 2.2 rule that actually binds here.

Recorded assumptions (unattended-surface rule, `user_story_alignment.md` Section 4):
- An empty `msg` (`GET /api/echo?msg=`) is accepted and returns 200 `{"echo": ""}`. Criterion 2 is about the parameter being absent, not empty, and no criterion asks for a minimum length, so no `min_length` is added.
- `msg` of exactly 200 characters is accepted (200 is the maximum, 201 is the first rejected length), which is what `max_length=200` means.
- The 422 body is FastAPI's default `RequestValidationError` shape. Tests assert the status code plus `detail[0]["loc"] == ["query", "msg"]` and `detail[0]["type"]` (`missing` / `string_too_long`), never the human-readable `msg` wording, which pydantic may re-phrase between releases.
- `msg` is returned verbatim after URL decoding (`msg=hello%20world` echoes `"hello world"`), which is what "query-string handling works end to end" means; no trimming, escaping or normalisation is applied.

## Frontend Plan
No frontend changes required. (The feature exposes a backend endpoint; nothing in the acceptance criteria renders it. Design reference mode is NONE and no UI is planned, so the design reference notes line is not applicable.)

## Backend Plan
- Endpoints: `GET /api/echo` in `backend/app/routers/echo.py`, `router = APIRouter(prefix="/api", tags=["echo"])`, matching `routers/version.py`. Handler signature: `def get_echo(msg: Annotated[str, Query(max_length=ECHO_MESSAGE_MAX_LENGTH)]) -> EchoResponse`, decorated `@router.get("/echo", response_model=EchoResponse)`. `msg` has no default, so it is required; the body is `return EchoResponse(echo=msg)` and nothing else. No `if`, no `len()`, no `HTTPException`.
- Service layer: none (see Plan Overview for the recorded reason). The router constructs the response model directly.
- Repository layer: none. No data access.
- Migrations: none. No schema change, no database involvement; the endpoint must answer with `DATABASE_URL` unset, as `/api/version` does.
- Schema module: `backend/app/schemas/echo.py` holds `ECHO_MESSAGE_MAX_LENGTH: int = 200` (module constant, `UPPER_SNAKE_CASE` per `coding_standards.md` Section 2.1) and `class EchoResponse(BaseModel)` with a single field `echo: str`, docstring in the style of `schemas/version.py`. The constant lives here so the bound is "stated in the schema" module and has one source: the router imports it for `Query(max_length=...)` and the integration tests import it for the boundary cases.
- App factory: `backend/app/main.py` gains `from app.routers.echo import router as echo_router` and `app.include_router(echo_router)` beside the three existing registrations. The module docstring's list of which feature registers which router gains a TEST-06 clause. No other change to `main.py`.
- Logging: nothing to log. There is no failure path of the application's own; validation failures are FastAPI's and are already reported through its handler.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg` (string, required, maximum 200 characters after URL decoding). No body.
- Response 200:

  ```json
  {"echo": "hello"}
  ```

  Defined by `EchoResponse` (`echo: str`) in `backend/app/schemas/echo.py`; `/openapi.json` references it as `#/components/schemas/EchoResponse` for the 200 response of `GET /api/echo`.
- Response 422, `msg` absent (FastAPI's standard validation response, produced by the framework, not by the handler):

  ```json
  {"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}
  ```

- Response 422, `msg` longer than 200 characters:

  ```json
  {"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "aaa…", "ctx": {"max_length": 200}}]}
  ```

  Clients and tests key on `type` and `loc`; the `msg` wording is pydantic's and is not part of this contract.
- Any other method on the path: 405 (FastAPI default, as with `/api/version` and `/api/health`).

## Technology Selection
- Required-parameter check (criterion 2): chose FastAPI's parameter declaration (a `msg: str` query parameter with no default, rejected by FastAPI's built-in `RequestValidationError` handler as 422) over a hand-written `if msg is None: raise HTTPException(422)`, because the framework already installed produces exactly the criterion's "standard validation response" and a hand-written branch would be a second, drifting copy of it.
- Length bound (criterion 3): chose `fastapi.Query(max_length=ECHO_MESSAGE_MAX_LENGTH)` over a `len(msg) > 200` check in the handler (which criterion 3 forbids) and over a custom pydantic validator, because the installed FastAPI/pydantic stack expresses the bound declaratively, reports it as the same 422 shape, and publishes it in the OpenAPI schema for free.
- Response schema (criterion 4): chose a pydantic `BaseModel` (`EchoResponse`, pydantic ships with the installed FastAPI, matching every file in `app/schemas/`) over a bare dict return, which criterion 4 forbids, and over a `TypedDict`, which FastAPI would not validate or document as a component.
- Service module: chose to construct the response in the router over a net-new `services/echo_service.py`, because there is no business logic, transaction or external call for a service to own; a pass-through module is the extra component the ladder exists to question. Recorded as a Section 2.2 deviation in the Plan Overview.
- No net-new dependency is added by this feature, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MESSAGE_MAX_LENGTH = 200` and the `EchoResponse` response schema (`echo: str`) for `GET /api/echo`.
- [B] backend/app/routers/echo.py: `GET /api/echo` router; required `msg` query parameter bounded by `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)`; returns `EchoResponse(echo=msg)`; no validation logic in the handler.
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle through the shared session `client` fixture: 200 `{"echo": "hello"}`; percent-encoded text round-trips; 422 with `loc ["query","msg"]` and type `missing` when `msg` is absent; 200 at exactly `ECHO_MESSAGE_MAX_LENGTH` characters; 422 type `string_too_long` at `ECHO_MESSAGE_MAX_LENGTH + 1`; `/openapi.json` names `EchoResponse` as the 200 schema; 405 on POST.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus the boundary edge case (exactly 200 characters accepted, 201 rejected).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo router and add one `app.include_router(echo_router)` line in `create_app()`; extend the module docstring's per-feature router list with TEST-06.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is in the app's custom route paths, following the existing version and health registration tests.

No dependency manifest changes, so no lockfile (`backend/uv.lock`) is touched: FastAPI and pydantic are already installed. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the application's endpoints.

## Testing Strategy
- Unit tests: no new unit module. There is no service-layer or utility function to isolate (`testing_standards.md` Section 6, first question answers no): the only code outside the router is a two-line pydantic model whose serialisation is FastAPI's to test, and the router's behaviour is HTTP behaviour, which is the integration tier's question. The unit tier's one contribution is the app-factory registration test added to the existing `test_main_unit.py`, matching the TEST-02 and TEST-05 precedent.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (the registration test goes into the existing `test_main_unit.py`; no `test_echo_*_unit.py` is created)
- Integration tests: the router through the full HTTP request/response cycle in `test_echo_integration.py`, using the session-scoped `client` fixture from `backend/tests/conftest.py`. The tests must not request the `database_url` or `db_connection` fixtures: the endpoint needs no database and the suite must stay runnable on a developer machine with no PostgreSQL, as `test_version_integration.py` is. Cases: (1) `GET /api/echo?msg=hello` → 200, body exactly `{"echo": "hello"}`; (2) edge, `msg=hello world` (percent-encoded by the client) → 200 `{"echo": "hello world"}`; (3) error, `GET /api/echo` → 422 with `detail[0]["loc"] == ["query", "msg"]` and `detail[0]["type"] == "missing"`; (4) boundary, `msg` of exactly `ECHO_MESSAGE_MAX_LENGTH` characters → 200 echoing the full string; (5) error, `msg` of `ECHO_MESSAGE_MAX_LENGTH + 1` characters → 422 with `loc == ["query", "msg"]` and `type == "string_too_long"`; (6) `GET /openapi.json` → `paths["/api/echo"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]["$ref"] == "#/components/schemas/EchoResponse"` and `components["schemas"]["EchoResponse"]["properties"]` has exactly the key `echo`; (7) `POST /api/echo` → 405. Boundary lengths are built from the imported `ECHO_MESSAGE_MAX_LENGTH`, never from a second literal 200, so the test proves the wiring rather than restating the constant (`coding_standards.md` Section 5's "assert the resolution, not the literal").
  - Directory: backend/tests/integration/ (`test_echo_integration.py`, per `test_{module}_integration.py`)
- E2E tests: not warranted for this feature. None of the four criteria involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion below: all four are HTTP status and payload behaviours of a backend endpoint that no page consumes), so no `e2e/tests/TEST-06_*.spec.ts` is produced and the per-feature edge-case spec obligation does not attach. E2E is ENABLED project-wide; this plan decides that the browser covers nothing here, as the TEST-02 plan did for the health endpoint.
  - Directory: e2e/tests/ (no file added)
  - File: none (naming would be `TEST-06_echo_endpoint.spec.ts` if one were warranted)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one boundary edge-case scenario (exactly 200 characters accepted, 201 rejected), validated for well-formedness, not executed as browser tests. Steps are phrased as HTTP requests and responses, as `TEST-02_health_endpoint.feature` does.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP cycle, and no UI consumes the endpoint |
| 2 | `GET /api/echo` with no `msg` returns 422, the standard validation response | Integration | Same: a request without the parameter and an assertion on the framework's 422 body; a browser adds nothing |
| 3 | `msg` longer than 200 characters returns 422, bound declared in the schema | Integration | Same: boundary requests at 200 and 201 characters over the HTTP cycle; the "declared, not hand-checked" half is read from the OpenAPI output and the router source at review, not from a browser |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Same: `/openapi.json` names `EchoResponse` as the 200 component and the body shape is asserted exactly; no interaction is involved |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo?msg=hello, Then the response is HTTP 200 with body `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with no query string, Then the response is HTTP 422 and its `detail` names the query parameter `msg` as missing |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with a 201-character `msg`, Then the response is HTTP 422 and its `detail` reports the string as too long with a maximum of 200; And a 200-character `msg` is echoed with HTTP 200 |
| 4 | Response defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads GET /openapi.json, Then the 200 response of GET /api/echo references the `EchoResponse` component whose only property is `echo` |

## Manual verification plan
None of the four criteria is verifiable through the application's own UI: no frontend consumes `GET /api/echo`. The observable check is the HTTP response itself, read with `curl`, plus FastAPI's generated Swagger UI at `/docs` for criterion 4, which a person can read in a browser.

Prerequisites (shared by every block): Docker running; the stack up via `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running (the `db` service is not needed by this endpoint but the compose file starts it anyway); a terminal with `curl`; the backend is published on the host at `http://localhost:8010` (from `docker-compose.yml`).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: the shared prerequisites above.
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json`.
2. Read the response body → exactly `{"echo":"hello"}`.
3. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`: the percent-encoded space was decoded and the text returned verbatim.

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response
Prerequisites: the shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity` (FastAPI 0.115 may spell the reason phrase `Unprocessable Content`; the code 422 is what matters).
2. Read the response body → a JSON object with a `detail` list whose single entry has `"type":"missing"` and `"loc":["query","msg"]`, in the shape `{"detail":[{"type":"missing","loc":["query","msg"],"msg":"Field required","input":null}]}`. It is neither a 500 nor an empty 200.

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema
Prerequisites: the shared prerequisites above; `python3` on the host to build the long strings.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*200, end='')")"` → `HTTP/1.1 200 OK` with a body of the form `{"echo":"aaa…a"}` containing exactly 200 `a` characters: 200 is the maximum and is accepted.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*201, end='')")"` → `HTTP/1.1 422 Unprocessable Entity`.
3. Read the response body → `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
4. Open `backend/app/routers/echo.py` in an editor → the handler declares `msg` with `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)` and its body is a single `return EchoResponse(echo=msg)`; there is no `len(` and no `HTTPException` in the file. This is the "declared, not hand-checked" half of the criterion, observable only in source.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the shared prerequisites above; a browser.
1. Open `http://localhost:8010/docs` in the browser → the Swagger UI lists a `GET /api/echo` operation under the `echo` tag.
2. Expand `GET /api/echo` and read its `200` response → the example body is `{"echo": "string"}` and the schema link names `EchoResponse`.
3. Scroll to the `Schemas` section at the bottom of the page → `EchoResponse` is listed with one required property, `echo` of type `string`.
4. Alternatively, in a terminal run `curl -s http://localhost:8010/openapi.json` → the JSON at `paths."/api/echo".get.responses."200".content."application/json".schema."$ref"` is `#/components/schemas/EchoResponse`, and `components.schemas.EchoResponse.properties` has exactly one key, `echo`.
5. Open `backend/app/schemas/echo.py` in an editor → it defines `class EchoResponse(BaseModel)` with the field `echo: str`, and `backend/app/routers/echo.py` returns an instance of it, not a dict.
