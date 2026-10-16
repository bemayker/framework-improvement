# UAT Script: TEST-07 Uptime endpoint

No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself: in a browser address bar, in FastAPI's interactive docs at http://localhost:8010/docs, or with curl.

## Prerequisites

- On branch `feature/TEST-07-uptime-endpoint` (or `main` once merged).
- From the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running.
- The backend answers on http://localhost:8010 (docker-compose.yml publishes 8010).
- A terminal with `curl` and `python3`, and a browser.

## Criterion 1: GET /api/uptime returns 200 with uptime_seconds and started_at

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` | First line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers | [ ] | [ ] |
| 1.2 | Run `curl -s http://localhost:8010/api/uptime \| python3 -m json.tool` | A JSON object with exactly two keys: `uptime_seconds` holding an unquoted number such as `42.137`, and `started_at` holding a quoted string such as `2026-10-16T03:33:49.120456Z`, and nothing else | [ ] | [ ] |
| 1.3 | Open http://localhost:8010/api/uptime in a browser | The page shows the same two keys, with the same `started_at` value as step 1.2 | [ ] | [ ] |

## Criterion 2: uptime_seconds is non-negative and increases between two calls a second apart

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds`, for example `42.137` | The value is 0 or greater, never negative | [ ] | [ ] |
| 2.2 | Run `sleep 1`, then `curl -s http://localhost:8010/api/uptime` again | `uptime_seconds` is larger than the value from step 2.1 by about 1, for example `43.141` | [ ] | [ ] |
| 2.3 | Open http://localhost:8010/api/uptime in a browser and press reload twice, a second or more apart | `uptime_seconds` grows on each reload and never goes down | [ ] | [ ] |

## Criterion 3: started_at is captured once at application startup, not recomputed per request, in UTC with an explicit offset

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and compare `started_at` | It is character-for-character identical in both responses, while `uptime_seconds` differs | [ ] | [ ] |
| 3.2 | Read `started_at` from step 3.1 | It ends in `Z` (the UTC offset designator), and its date and time match the moment the backend container started, which `docker compose ps` shows as its uptime (`Up N minutes`) and which roughly equals `uptime_seconds` counted back from now | [ ] | [ ] |
| 3.3 | Run `docker compose restart backend`, then `docker compose ps` until `backend` reports running again, then `curl -s http://localhost:8010/api/uptime` | `started_at` is now later than the value from step 3.1 and `uptime_seconds` is small (a few seconds): this is how an operator tells a restart from a long-lived process | [ ] | [ ] |
| 3.4 | Open `backend/app/main.py` and `backend/app/routers/uptime.py` | The first statement of `lifespan` stores `uptime_service.capture_start()` on `app.state.uptime_start`; the handler reads the mark with `get_start_mark` and never calls `capture_start` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/

This is a code-structure property with no UI behaviour; the observable checks are the OpenAPI document and the module.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open http://localhost:8010/docs, expand `GET /api/uptime`, look under `Responses` for code `200` | The schema is named `UptimeResponse` with two required properties, `uptime_seconds` (number) and `started_at` (string, date-time) | [ ] | [ ] |
| 4.2 | Open http://localhost:8010/openapi.json and find `components`, then `schemas`, then `UptimeResponse` | `uptime_seconds` has `type` `number` and `minimum` `0`; `started_at` has `type` `string` and `format` `date-time`; both are listed under `required` | [ ] | [ ] |
| 4.3 | Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` | `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`; the router declares `response_model=UptimeResponse` and returns an `UptimeResponse`, never a dict literal | [ ] | [ ] |
| 4.4 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1. Uptime returns 200 with the body | 1.1 to 1.3 | | |
| 2. Non-negative and increasing uptime_seconds | 2.1 to 2.3 | | |
| 3. started_at captured once, UTC with offset | 3.1 to 3.4 | | |
| 4. Pydantic response schema | 4.1 to 4.4 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
