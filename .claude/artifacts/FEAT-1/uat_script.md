# UAT Script: FEAT-1 Server time endpoint

None of the four acceptance criteria is verifiable through the application's UI: no frontend consumes `GET /api/time`. The observable check is the HTTP response itself, read with `curl`, plus FastAPI's generated Swagger UI at `/docs` for criterion 3, which a person can read in a browser. Two steps (3.3 and 3.4) read source files, because the "defined by a Pydantic schema, not by a bare dict" half of criterion 3 is observable only there, and criterion 4 is about the test suite, so its steps run `pytest` rather than `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- No root `.env` file is required. `docker-compose.yml` carries usable defaults for every variable it substitutes and sets the backend's `DATABASE_URL` itself.
- A terminal with `curl`, and a browser for criterion 3 steps 3.1 and 3.2.
- `uv` installed for criterion 4, with the backend dependencies synced (`uv sync` inside `backend/`). No database is needed for the two FEAT-1 test files.
- **The `db` service is irrelevant to this endpoint but is still needed to start the stack.** `GET /api/time` opens no database connection and answers whether or not PostgreSQL is reachable, exactly as `GET /api/echo` and `GET /api/version` do. The compose `backend` service nevertheless declares `depends_on: db: condition: service_healthy`, so the container will not start until `db` reports healthy. Bring the whole stack up as below and ignore `db` from then on.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | In a terminal, run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 1.2 | Read the response body | A JSON object with exactly two keys, in the shape `{"now":"2026-09-14T10:15:30.123456+00:00","timezone":"UTC"}`: `now` is a full ISO 8601 timestamp with a date, a `T`, a time with fractional seconds and the suffix `+00:00`; `timezone` is exactly `UTC`. Nothing else is in the object | [ ] Pass [ ] Fail |
| 1.3 | Compare the `now` value's hour and minute with the current UTC time, for example by running `date -u` | They match to within a few seconds. The value is UTC, not the host's local zone — so on a host that is not on UTC, `now` differs from `date` (local) and agrees with `date -u` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive

Prerequisites: the shared prerequisites above; criterion 1 just verified, stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Run `curl -s http://localhost:8010/api/time` and note the `now` value | A value of the form `2026-09-14T10:15:30.123456+00:00`. Write it down; step 2.2 compares against it | [ ] Pass [ ] Fail |
| 2.2 | Wait at least one second (count to two, or run `sleep 1`), then run `curl -s http://localhost:8010/api/time` again | The `now` value is different from step 2.1 and later than it: the seconds field, or the minute, has advanced. It is not the same string, which is what a cached or module-level clock read would produce | [ ] Pass [ ] Fail |
| 2.3 | Inspect both `now` values from steps 2.1 and 2.2 | Each ends with the literal six characters `+00:00`. Neither ends with the letter `Z`, and neither ends with a bare time (a naive value would end in `...30.123456` with nothing after it) | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

Prerequisites: the shared prerequisites above, including a browser. Stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Open `http://localhost:8010/docs` in the browser and expand `GET /api/time` under the `time` tag | The Swagger UI lists the operation, and its "Successful Response" schema is named `ServerTimeResponse` and lists `now` and `timezone`. The operation takes no parameters | [ ] Pass [ ] Fail |
| 3.2 | Scroll to the `Schemas` section at the bottom of the page and expand `ServerTimeResponse` | It has exactly two properties: `now`, a `string` of format `date-time`, and `timezone`, whose allowed values are the single entry `UTC` | [ ] Pass [ ] Fail |
| 3.3 | In a terminal, run `curl -s http://localhost:8010/openapi.json` and read the JSON | At `paths."/api/time".get.responses."200".content."application/json".schema."$ref"` the value is `#/components/schemas/ServerTimeResponse`, and `components.schemas.ServerTimeResponse.properties` has exactly the two keys `now` and `timezone` | [ ] Pass [ ] Fail |
| 3.4 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` in an editor | The schema module defines `SERVER_TIMEZONE = "UTC"` and `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime`, `timezone: Literal["UTC"]` and a `field_serializer` for `now` that returns `value.isoformat()` — which is where the `+00:00` of criterion 2 comes from. The router declares `response_model=ServerTimeResponse` and its body is the single statement `return ServerTimeResponse(now=datetime.now(timezone.utc), timezone=SERVER_TIMEZONE)`: an instance of that model, not a dict literal. `backend/app/services/` contains no `server_time_service.py` — that is the planned deviation from `coding_standards.md` Section 2.2 recorded in the plan and in the PR description, not an omission | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

Prerequisites: `uv` installed and the backend dependencies synced. The compose stack is not needed for these two steps; they run against the checkout.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | From the `backend/` directory run `uv run pytest tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py -v` | The output lists tests naming the aware UTC result, the distinct successive calls with a fake clock, the naive-datetime rejection, the non-UTC `timezone` rejection, the `+00:00` suffix, the 200 body shape, the one-second freshness check, the OpenAPI schema reference and the 405 on POST. The final line reports every one of them passed, with 0 failed | [ ] Pass [ ] Fail |
| 4.2 | From the `backend/` directory run `uv run pytest -q` | The whole backend suite passes, including `tests/unit/test_main_unit.py::test_create_app_registers_time_route` and the pre-existing `test_create_app_registers_echo_route`: adding `/api/time` to the app factory did not displace the routes already registered there | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (3 + 3 + 4 + 2) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
