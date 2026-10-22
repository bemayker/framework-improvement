# UAT Script: TEST-07 Uptime endpoint

`GET /api/uptime` reports how long the backend process has been running and the UTC instant it started. No UI consumes the endpoint, so every step is checked with `curl`, the OpenAPI document and the test suite against the running backend.

## Prerequisites

- Docker is running.
- Repository checked out on `feature/TEST-07-uptime-endpoint`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010` (the `docker-compose.yml` mapping `8010:8010`).
- A terminal with `curl` and `python3`.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` | First line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers | [ ] | [ ] |
| 1.2 | Read the body printed by step 1.1 | One JSON object with exactly two keys: `uptime_seconds` (a number such as `42.137`, no quotes) and `started_at` (a quoted string such as `"2026-10-22T16:52:51.123456Z"`), and nothing else | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON bodies are printed | [ ] | [ ] |
| 2.2 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second is larger than the first by about 1 (between 1.0 and roughly 1.2, allowing for curl's own time) | [ ] | [ ] |
| 2.3 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/integration/test_uptime_integration.py` | The run reports `0 failed` for those two files | [ ] | [ ] |

## Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime; sleep 2; curl -s http://localhost:8010/api/uptime` | The two `started_at` strings are character-for-character identical, while `uptime_seconds` grew by about 2 | [ ] | [ ] |
| 3.2 | Read the `started_at` value | It ends in `Z`, ISO 8601's zero-UTC-offset designator; it never ends without a designator (a naive time) | [ ] | [ ] |
| 3.3 | Run `python3 -c "from datetime import datetime; print(datetime.fromisoformat('PASTE_STARTED_AT_HERE').utcoffset())"`, replacing `PASTE_STARTED_AT_HERE` with the value from step 3.1 | Prints `0:00:00` | [ ] | [ ] |
| 3.4 | Run `docker compose restart backend`, wait until `docker compose ps` shows it running again, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is a later instant than in step 3.1, and `uptime_seconds` is small (a few seconds), showing a restart is distinguishable from a long-lived process | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `backend/app/schemas/uptime.py` | Defines `class UptimeResponse(BaseModel)` with `uptime_seconds: float` constrained `ge=0` and `started_at: AwareDatetime`, and no serializer method | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/uptime.py` | The route declares `response_model=UptimeResponse` and returns an `UptimeResponse(...)` instance, not a dict literal | [ ] | [ ] |
| 4.3 | Run `curl -s http://localhost:8010/openapi.json` and find `paths`, `/api/uptime`, `get`, `responses`, `200` | Its schema is a `$ref` to a `components.schemas` entry named for `UptimeResponse`; in that entry `uptime_seconds` is `"type": "number"`, `started_at` is `"type": "string"` with `"format": "date-time"`, and both are listed under `required` | [ ] | [ ] |
| 4.4 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` | The run reports `0 failed` for those three files | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1 to 1.2 | | |
| 2. Non-negative, increases a second apart | 2.1 to 2.3 | | |
| 3. Captured once, UTC with explicit offset, restart changes it | 3.1 to 3.4 | | |
| 4. Response defined by a Pydantic schema | 4.1 to 4.4 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
