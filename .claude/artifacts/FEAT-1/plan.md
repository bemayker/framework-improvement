# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for **measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010)**. It exists to **overlap** a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change. That overlap is the whole point (measured run 2 chose its Arm D item for independence and MDF-010 went unmeasured for the third time; `docs/measurement-baseline-0.3.132.md` Section 5.2).
>
> ## What
>
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> ## Acceptance criteria
>
> * `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> * `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> * The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> * Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> ## Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. **It touches** **`main.py`****'s router registration, so it must not be built concurrently with another backend item that does the same.**
>
> ## How the measured run uses this item (operator instructions, not part of the feature)
>
> 1. `/plan-feature TEST-09` **before** Arm C's item (TEST-06) merges. Leave it at `plan_review`; a re-plan is only possible there (baseline Section 5.3).
> 2. After TEST-06 merges to `main` (its squash touches `backend/app/main.py`), post the re-plan comment on this item and run `/plan-feature TEST-09` again.
> 3. **Pass:** the merged-since check reports a non-clean verdict naming the overlapping commit, and the re-plan answers the comment point by point (MDF-008). **`verdict=clean`** **on this item is a failed setup, not a pass** (baseline Section 5.2).
> 4. Do not build it before step 3 has been recorded. Whether it is then built is the operator's choice; it is not one of the items the baseline's numbers are compared on.

Scope note: the last section of the feature text is labelled *operator instructions, not part of the feature* and is excluded from this plan. The item refers to itself as `TEST-09`; its framework ID in `feature_map.md` and `project_state.json` is **FEAT-1**, which every path, branch and manifest entry below uses.

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Plan Overview
Backend-only feature. Add `GET /api/time` to the FastAPI app following the project's existing Router → Service pattern for a dependency-free GET (`app/routers/version.py`, `app/services/version_service.py`, `app/schemas/version.py`; TEST-06's echo router is named by the item as the shape to follow but is not on `origin/main`, so the version endpoint is the closest committed precedent). A `server_time` router delegates to a `server_time_service` that reads the clock once per request with `datetime.now(timezone.utc)`; the response is a `ServerTimeResponse` Pydantic model whose `now` field is typed as an aware datetime and serialised with `isoformat()`, so the wire value always carries an explicit `+00:00` offset. No frontend work, no repository layer, no migrations, no new dependencies.

Recorded assumptions (the criteria are silent, decided here rather than blocking):
1. "Explicit offset" is serialised as `+00:00`, not `Z`. Both are valid ISO 8601 offset designators, but `+00:00` is the unambiguous reading of "explicit offset" and is what `datetime.isoformat()` produces for an aware UTC datetime; Pydantic's default serialiser would emit `Z`, so the schema pins the format with a field serialiser. Tests assert the literal suffix as well as the parsed offset.
2. Precision is Python's default microsecond `isoformat()` output (`2026-09-14T10:15:30.123456+00:00`). Nothing in the criteria asks for truncation, and microsecond precision is what makes two closely spaced calls distinguishable.
3. `timezone` is a fixed literal `"UTC"`, typed `Literal["UTC"]` in the schema: the endpoint never reports another zone, so the type documents that rather than a free string.

The module stem is `server_time` (router `server_time.py`, service `server_time_service.py`, schema `server_time.py`) rather than `time`, so no module in `app/` shadows the standard library's `time`.

## Frontend Plan
No frontend changes required. (The feature exposes a backend endpoint; nothing in the acceptance criteria renders it. Design reference mode is NONE and no UI is planned.)

## Backend Plan
- Endpoints: `GET /api/time` (router `app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, matching the version router's shape). Returns 200 with `ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)`. No business logic in the router, no bare dict.
- Service layer: `app/services/server_time_service.py` with `SERVER_TIMEZONE = "UTC"` and `get_server_time() -> datetime` returning `datetime.now(timezone.utc)`. It is called on every request and caches nothing, which is what "computed per request" means at this layer; there is no error path (the system clock always answers), so no exception handling and no logging beyond the module-level logger the sibling services declare.
- Repository layer: none. No data access.
- Migrations: none. No schema change.
- Schema: `app/schemas/server_time.py` with `ServerTimeResponse(BaseModel)`: `now: AwareDatetime` (Pydantic's aware-only type, so a naive datetime is rejected at construction, which is the "never naive" guarantee), `timezone: Literal["UTC"]`, and a `@field_serializer("now")` returning `value.isoformat()` so the JSON carries `+00:00`.
- App factory: `app/main.py` imports `router as server_time_router` from `app.routers.server_time` and adds one `app.include_router(server_time_router)` line after the health router; the module docstring's list of registering features gains one clause for FEAT-1. Nothing else in the factory changes.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: none (no parameters, no body)
- Response 200:

  ```json
  {"now": "2026-09-14T10:15:30.123456+00:00", "timezone": "UTC"}
  ```

  `now` is an ISO 8601 timestamp in UTC with the explicit `+00:00` offset, microsecond precision, read from the clock on every request. `timezone` is always the literal `UTC`.
- Schema: `ServerTimeResponse` in `app/schemas/server_time.py` (`now: AwareDatetime` serialised via `isoformat()`, `timezone: Literal["UTC"]`).
- Any other method on the path: 405 (FastAPI default, as with `/api/version` and `/api/health`).

## Technology Selection
- Current UTC time: chose the standard library's `datetime.now(timezone.utc)` over a date library (`arrow`, `pendulum`, `python-dateutil`, none of which the project installs), because the stdlib returns an aware UTC datetime in one call and nothing here needs parsing, arithmetic or zone conversion.
- Explicit-offset serialisation: chose `datetime.isoformat()` on the aware value (stdlib, emits `+00:00`) over Pydantic's default datetime serialiser (already installed, emits `Z`), because the criterion asks for an explicit offset and `+00:00` is the unambiguous reading; wired through a Pydantic `field_serializer` rather than formatting in the router, so the format lives with the schema that owns the field.
- Naive-datetime rejection: chose the already-installed Pydantic `AwareDatetime` type over a hand-written `field_validator` checking `tzinfo`, because the type expresses the constraint with no code of its own.
- Fixed timezone label: chose `Literal["UTC"]` (stdlib `typing`, validated by installed Pydantic) over a plain `str` field plus a test asserting its value, because the type makes any other value a validation error rather than a test-time discovery.
- Response schema: Pydantic `BaseModel`, already installed with FastAPI and matching every existing file in `app/schemas/`; no alternative considered necessary.
- Freshness check in tests: chose `time.sleep(1)` (stdlib) for the integration tier's literal "a second apart" assertion, and `monkeypatch` (installed with pytest) of the service's clock for the deterministic unit-tier check, over `freezegun` or `time-machine` (not installed), because two calls and a comparison need no clock-freezing library.
- No net-new dependency is added by this feature, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` (`now: AwareDatetime` with `isoformat()` field serializer, `timezone: Literal["UTC"]`) for `GET /api/time`.
- [B] backend/app/services/server_time_service.py: `SERVER_TIMEZONE` constant and `get_server_time()` returning `datetime.now(timezone.utc)` on every call.
- [B] backend/app/routers/server_time.py: `GET /api/time` router building `ServerTimeResponse` from the service, no business logic.
- [B] backend/tests/unit/test_server_time_service_unit.py: service and schema unit tests (clock monkeypatched): aware UTC result, two calls return distinct values (no caching), naive datetime rejected by the schema, serialised string ends in `+00:00`.
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `utcoffset() == timedelta(0)` and ends with `+00:00`, two requests one second apart return strictly increasing `now`, 405 on POST.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (a second request never returns the same or an earlier timestamp).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the server time router and register it in `create_app()` (one `include_router` line after the health router); extend the module docstring's feature list with FEAT-1.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is in the app's custom route paths, in the shape of the existing version and health assertions.

No dependency manifest changes, so no lockfile is touched (`fastapi`, `pydantic` and `pytest` are already installed and the stdlib covers the rest). Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the existing API endpoints.

## Testing Strategy
- Unit tests: `server_time_service.get_server_time()` and `ServerTimeResponse`, no HTTP. Happy path: the result is aware and `utcoffset()` is zero. Edge case: with the module's `datetime` reference monkeypatched to a fake whose `now()` returns successive distinct values, two calls return different results (proves no caching, deterministic, no sleep). Error case: `ServerTimeResponse(now=datetime(2026, 1, 1), timezone="UTC")` raises `pydantic.ValidationError` (naive rejected). Plus: `model_dump(mode="json")["now"]` for a known aware UTC value equals its `isoformat()` and ends with `+00:00`. Plus the app-factory registration test added to `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_service_unit.py`; route registration goes into the existing `test_main_unit.py`)
- Integration tests: router through the full HTTP request/response cycle using the shared session-scoped `client` fixture from `backend/tests/conftest.py` (no database is needed, so none of the `database_url` fixtures are used and the tests run wherever the unit tier runs). 200 with body keys exactly `{"now", "timezone"}` and `timezone == "UTC"`; `datetime.fromisoformat(body["now"])` succeeds, `.utcoffset() == timedelta(0)`, `.tzinfo is not None`, and the string ends with `+00:00`; freshness: two GETs separated by `time.sleep(1)` return `now` values where the second parses strictly later than the first; skew sanity: `now` is within 5 seconds of the test process's own `datetime.now(timezone.utc)`; 405 on POST (the only reachable error case, as for the version and health endpoints).
  - Directory: backend/tests/integration/ (`test_server_time_integration.py`)
- E2E tests: not warranted for this feature. No criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion below: all four are HTTP payload, type and test-coverage properties of a backend endpoint no UI consumes), so no `e2e/tests/FEAT-1_*.spec.ts` is produced and the per-feature edge-case spec obligation does not attach. The `E2E Tests: ENABLED` toggle governs whether the tier may run, not whether every feature gets a spec.
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (repeated requests are monotonic and never equal), validated for well-formedness, not executed as browser tests. Manual script expanded from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP cycle and no UI consumes the endpoint |
| 2 | `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive | Integration (freshness and offset over HTTP) plus Unit (no-caching with a fake clock, naive rejected by the schema) | Verifying it needs no navigation or interaction: two HTTP calls and a parse settle freshness and offset, and the naive-rejection rule is a schema validation rule |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router | Unit | Verifying it needs no navigation or interaction: `ServerTimeResponse` is imported from `app.schemas.server_time` and exercised directly; the router's `response_model` wiring is confirmed by the integration tier's exact-keys assertion |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | The criterion is satisfied by the existence and passing of the tests named above; a browser adds nothing to a criterion about the test suite itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response is HTTP 200 with a `now` timestamp and `timezone` equal to "UTC" |
| 2 | `now` is fresh per request, UTC with explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests GET /api/time twice one second apart, Then both `now` values end in "+00:00" and the second is later than the first |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads GET /openapi.json, Then the `/api/time` 200 response references a `ServerTimeResponse` schema with `now` and `timezone` properties |
| 4 | Unit and integration tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When `uv run pytest -q` runs, Then the server time unit and integration tests are collected and pass |

## Manual verification plan
### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
This criterion is not verifiable through the UI (no frontend consumes the endpoint); the observable check is the HTTP response itself, read with curl.
Prerequisites: Docker running; the stack up via `docker compose up -d --build` from the repo root; `docker compose ps` shows the `backend` service running on host port `8010` (the mapping `docker-compose.yml` publishes). A terminal with `curl`.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the response body → a JSON object with exactly two keys, in the shape `{"now":"2026-09-14T10:15:30.123456+00:00","timezone":"UTC"}`: `now` is a full ISO 8601 timestamp with a date, a `T`, a time with fractional seconds and the suffix `+00:00`; `timezone` is exactly `UTC`.
3. Compare the `now` value's hour and minute with the current UTC time (for example `date -u`) → they match to within a few seconds; the value is UTC, not the host's local zone.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Not verifiable through the UI; the observable check is two HTTP responses compared.
Prerequisites: criterion 1 just verified, stack still up.
1. Run `curl -s http://localhost:8010/api/time` and note the `now` value → for example `2026-09-14T10:15:30.123456+00:00`.
2. Wait at least one second (count to two, or run `sleep 1`), then run `curl -s http://localhost:8010/api/time` again → the `now` value is different from step 1 and later than it (the seconds field, or the minute, has advanced).
3. Inspect both `now` values → each ends with the literal offset `+00:00`; neither ends with a bare time and no digits after the seconds are missing an offset (a naive value would end in `...30.123456` with nothing after it).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Not verifiable through the UI; the observable check is the OpenAPI document FastAPI generates from the schema, plus the source file.
Prerequisites: stack still up.
1. Run `curl -s http://localhost:8010/openapi.json` and search the output for `ServerTimeResponse` → the string is present under `components.schemas`, with `properties.now` of type `string` (format `date-time`) and `properties.timezone` with `enum: ["UTC"]`, and the `/api/time` GET's 200 response references `#/components/schemas/ServerTimeResponse`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the "Successful Response" schema is named `ServerTimeResponse` and lists `now` and `timezone`.
3. In the repository, open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with the two fields; open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and returns an instance of it, not a dict literal.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Not verifiable through the UI; the observable check is the test run's own output.
Prerequisites: `uv` installed and the backend dependencies synced (`uv sync` inside `backend/`). No database is needed for these two files.
1. From the `backend/` directory run `uv run pytest -q tests/unit/test_server_time_service_unit.py tests/integration/test_server_time_integration.py -v` → the output lists tests whose names name the aware UTC result, the distinct-successive-calls case, the naive-datetime rejection, the `+00:00` suffix, the 200 shape, the one-second freshness check and the 405 case, and the final line reports all of them passed with 0 failed.
2. From the `backend/` directory run `uv run pytest -q` → the whole backend suite passes, including `tests/unit/test_main_unit.py::test_create_app_registers_time_route`.
