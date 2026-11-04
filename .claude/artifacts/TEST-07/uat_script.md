# UAT Script, TEST-07: Uptime endpoint

`GET /api/uptime` reports how long the backend process has been running, so an operator can tell a restart from a long-lived process.

No frontend consumes this endpoint, so every check below is an HTTP response read with curl, or a source and test check.

## Prerequisites
- Docker is running.
- The stack is up: from the repository root, run `docker compose up -d --build`.
- `docker compose ps` shows the `backend` service running (it publishes port 8010, per `docker-compose.yml`).
- `curl` is available. For Criterion 4, `uv` is installed.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the response body | Exactly two keys, for example `{"uptime_seconds":12.84,"started_at":"2026-11-04T18:18:00.123456+00:00"}`; `uptime_seconds` is a bare number (no quotes) and `started_at` is a quoted ISO 8601 string | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisite: Criterion 1 verified, stack still up.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON bodies print one after the other | [ ] | [ ] |
| 2.2 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second is larger than the first by roughly one second (for example `30.12` then `31.14`) | [ ] | [ ] |

## Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisite: Criterion 2 verified, stack still up.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Look at the two bodies from step 2.1 and note the `started_at` value | `started_at` is character-for-character identical in both, while `uptime_seconds` differs | [ ] | [ ] |
| 3.2 | Read the end of the `started_at` string | It ends in `+00:00` (an explicit UTC offset), never in `Z` and never with no offset at all | [ ] | [ ] |
| 3.3 | Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the value noted in step 3.1 and `uptime_seconds` is small (a few seconds): the value was taken when the process started | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
This criterion is a code-structure rule, not UI behaviour; the check is the source and the tests that import it.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/uptime.py` | The `GET /uptime` route declares `response_model=UptimeResponse` | [ ] | [ ] |
| 4.3 | From the repository root, run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The summary line reports `0 failed` | [ ] | [ ] |

## Edge case: a method other than GET is not allowed

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 5.1 | Run `curl -i -X POST http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1, 1.2 | [ ] Pass  [ ] Fail |
| 2. Non-negative and increasing | 2.1, 2.2 | [ ] Pass  [ ] Fail |
| 3. Captured once, UTC with explicit offset | 3.1, 3.2, 3.3 | [ ] Pass  [ ] Fail |
| 4. Pydantic schema in `backend/app/schemas/` | 4.1, 4.2, 4.3 | [ ] Pass  [ ] Fail |
| Edge case: POST answers 405 | 5.1 | [ ] Pass  [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
