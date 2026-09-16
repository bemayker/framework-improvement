# UAT Script: FEAT-1 Server time endpoint

Neither acceptance criterion is verifiable through the UI: `GET /api/time` has no frontend consumer, so the observable checks are the HTTP response itself (read with `curl` and a browser tab), the generated OpenAPI document, and the backend test suite's own output.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or later, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl` and `date`, and a browser.
- The endpoint is public: no login, no seed data, and no feature toggle is needed.
- Step set 4 only: `uv` installed on the host and the backend dependencies synced (`cd backend && uv sync`), or run the equivalent command from the repository root as shown.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db`, `backend`, and `frontend` services all show as running.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal at the repository root, run `curl -i http://localhost:8010/api/time` | The first response line is `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] Pass [ ] Fail |
| 2 | Read the body on the last line of that output | It is a single JSON object with exactly two keys, for example `{"now":"2026-09-16T09:41:07.512834+00:00","timezone":"UTC"}`. There is no envelope, no `data` wrapper, and no third key | [ ] Pass [ ] Fail |
| 3 | Read the `timezone` value | It is exactly the string `UTC` | [ ] Pass [ ] Fail |
| 4 | Open `http://localhost:8010/api/time` in a browser tab | The same two-key JSON object is displayed, confirming the endpoint is reachable without a client that sets special headers | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` and `curl -s http://localhost:8010/api/health` in the same terminal | Both return their normal 200 responses (`/api/version` a version object, `/api/health` `{"status":"ok",...}` with the database reachable), confirming the time router's registration did not disturb the routes already in `create_app()`'s registration block | [ ] Pass [ ] Fail |

**Correction note:** the plan's original step 5 asked to curl `/api/echo` to confirm the time route did not disturb "the echo route TEST-06 registered immediately above the time route". There is no echo route on this branch: TEST-06 merged to `origin/main` after this branch's base, and per `build-feature` Section 4 step 5 the branch is built without rebasing or merging main in, so this working tree registers exactly three other routers (`version`, `notes`, `health`) plus this feature's `time` router, and `/api/echo` returns 404 here. Step 5 above checks the same regression concern (that registering the time route left the neighboring routes intact) against two routes that actually exist on this branch instead.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In the terminal, run `curl -s http://localhost:8010/api/time` and write down the `now` value, for example `2026-09-16T09:41:07.512834+00:00` | A JSON `now` value is captured | [ ] Pass [ ] Fail |
| 2 | Wait at least one second (count to two), then run `curl -s http://localhost:8010/api/time` again and write down the second `now` value | The two values are different, and the second one is later than the first when read left to right (its seconds field has advanced by at least one) | [ ] Pass [ ] Fail |
| 3 | Read the last six characters of both values | Each is exactly `+00:00`. Neither ends in `Z`, and neither stops after the seconds or microseconds with no offset at all (a value such as `2026-09-16T09:41:07.512834` with nothing after it is a failure of this step) | [ ] Pass [ ] Fail |
| 4 | Run `date -u +%Y-%m-%dT%H:%M:%S` in the same terminal and compare it with the `now` value from step 2 | The two agree to within a few seconds, confirming the endpoint reports UTC and not a local zone shifted to look like UTC | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

This criterion is about how the response is produced and cannot be confirmed from the response body alone, so it is checked against the generated OpenAPI document and the source files, which only exist/read this way because a schema defines the response.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/docs` in a browser and expand the `GET /api/time` entry | The "Successful Response" block names the schema `TimeResponse` rather than an untyped object, and lists `now` as a `string` with format `date-time` and `timezone` as a string fixed to `UTC` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/openapi.json \| grep -c TimeResponse` in the terminal | The count is at least 1, meaning the endpoint's response is declared against the named schema in the generated document | [ ] Pass [ ] Fail |
| 3 | Open `backend/app/schemas/time.py` in an editor | It defines `class TimeResponse(BaseModel)` with `now: AwareDatetime`, `timezone: Literal["UTC"] = "UTC"`, and a `@field_serializer("now")` that returns `value.astimezone(UTC).isoformat()`. Confirmed against the file as built: this matches exactly | [ ] Pass [ ] Fail |
| 4 | Open `backend/app/routers/time.py` in an editor | The handler's return statement constructs `TimeResponse(now=datetime.now(UTC))` and the route decorator carries `response_model=TimeResponse`; there is no `return {"now": ...}` dict literal anywhere in the file. Confirmed against the file as built: this matches exactly | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the shape, the offset, and the per-request freshness

This criterion is about the test suite rather than about the running application, so the observable check is the suite's own output rather than a screen.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | From the repository root, run `uv run --directory backend pytest -q tests/unit/test_time_router_unit.py tests/integration/test_time_integration.py` | The run finishes with `0 failed` and no test is reported as skipped | [ ] Pass [ ] Fail |
| 2 | Re-run it with names shown: `uv run --directory backend pytest -v tests/unit/test_time_router_unit.py tests/integration/test_time_integration.py` | The listed test names include one asserting the exact `+00:00` suffix, one asserting two consecutive calls return different values, and one asserting the 200 response's two-key shape, each reported as `PASSED` | [ ] Pass [ ] Fail |
| 3 | From the repository root, run the project's full gate command `uv run --directory backend pytest -q && npm --prefix frontend test` | Both suites pass, confirming the new tests did not break an existing one (in particular the version, health, and route-registration cases in `tests/unit/test_main_unit.py`) | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Criterion 1, steps 1-4 |
| 2. `now` is computed per request, serialised in UTC with an explicit offset, never naive | Criterion 2, steps 1-4 |
| 3. The response body is defined by a Pydantic schema, not a bare dict | Criterion 3, steps 1-4 |
| 4. Unit and integration tests cover the shape, the offset, and the per-request freshness | Criterion 4, steps 1-3 |
| Edge case: a non-UTC aware instant is still reported in UTC | Covered by the unit test asserted in Criterion 4 step 2 (non-UTC normalisation case); not independently manually clickable since it requires constructing a `TimeResponse` from a non-UTC instant in code |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 (4 + 4 + 4 + 3, plus 1 correction note) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
