# UAT Script: FEAT-1 Server time endpoint

This feature adds no UI. All four criteria are verified against the running API rather than through a screen, so each block below gives the observable check, the exact command and the exact expected output, instead of a click path.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- The stack is up (`docker compose up -d --build` from the repository root) and the backend answers on `http://localhost:8010`; confirm with `http://localhost:8010/api/version`, which must render a JSON body containing a `version` key. No database is needed for this endpoint specifically, and the endpoint is unauthenticated so no sign-in is required.
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`.
- Criterion 2 also needs a second terminal showing the current UTC time (`date -u`).
- Criterion 4 needs `uv` installed on the host and the backend dependencies synced (`cd backend && uv sync`), or the equivalent via `docker compose exec backend`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: GET /api/time returns 200 with an ISO 8601 UTC `now` and `timezone` equal to UTC

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] Pass [ ] Fail |
| 2 | Read the body printed under the headers | It is a single JSON object with exactly two keys, `now` and `timezone`, for example `now` = `2026-09-20T14:32:07.481923+00:00` and `timezone` = `UTC`. There is no third key and no wrapper object | [ ] Pass [ ] Fail |
| 3 | Read the value of `timezone` in that body | It is the string `UTC`, in those three capital letters | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive

Prerequisites: as criterion 1, plus a second terminal showing the current UTC time (`date -u`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/time` and write down the `now` value, for example `2026-09-20T14:32:07.481923+00:00` | The command returns a single JSON object with a `now` value | [ ] Pass [ ] Fail |
| 5 | Wait one second, then run `curl -s http://localhost:8010/api/time` again and write down the second `now` value | It is a **later** timestamp than the first, differing by roughly one second. Two identical values would mean the timestamp was computed once at import and cached, which is the failure this step exists to catch | [ ] Pass [ ] Fail |
| 6 | Read the last six characters of either `now` value | They are exactly `+00:00`. Not `Z`, and not absent. A value ending in the seconds digits with no offset at all is naive and is a failure | [ ] Pass [ ] Fail |
| 7 | Compare either `now` value against `date -u` in the second terminal | The two agree to within a few seconds. A value that is hours off means the server built the string from local time and labelled it UTC | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

Prerequisites: as criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser | The FastAPI interactive documentation page loads and lists a `time` tag | [ ] Pass [ ] Fail |
| 9 | Expand `GET /api/time` under that tag and open its "Successful Response" example | The schema is named `TimeResponse` and shows the two fields `now` (string, date-time) and `timezone` (string, with the single allowed value `UTC`). A handler returning a bare dict would show an empty or generic schema here, which is the difference this step reads | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/time.py` in an editor | It declares `class TimeResponse(BaseModel)` with those two fields, and `backend/app/routers/time.py` returns `TimeResponse(...)` rather than a dict literal | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

This criterion is about the test suite rather than about a running screen, so the observable check is the suite's own output.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repository root, run `uv run --directory backend pytest -q tests/unit/test_time_unit.py tests/integration/test_time_integration.py` | The summary line reports every test passed and zero failed. A `no tests ran` or `collected 0 items` line means the files are missing or misnamed, and is a failure | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q` for the whole backend suite | The summary line reports zero failures, confirming the new router registration broke neither `test_main_unit.py` nor any merged feature's tests | [ ] Pass [ ] Fail |
| 13 | Open `backend/tests/integration/test_time_integration.py` | It contains an assertion on the literal suffix `+00:00` and a test that issues two requests and compares the two parsed instants. Both must be present: a suite that only checked the status code would pass while criteria 1 and 2 were unmet | [ ] Pass [ ] Fail |

### Edge case: two consecutive reads differ

Covered by steps 4 to 5 above (the two sequential `now` reads a second apart), which belong to criterion 2's freshness check and are not repeated here as a separate step.

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
