# UAT script, TEST-07: Uptime endpoint

Manual acceptance script for `GET /api/uptime`. None of the criteria has a UI in the app itself; every check is an HTTP call from a terminal or the FastAPI docs page.

## Prerequisites

- [ ] The stack is running: `docker compose up -d --build` from the repository root.
- [ ] The backend answers on `http://localhost:8010` (compose maps `8010:8010`).
- [ ] `curl` is available in your terminal.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

1. [ ] Run `curl -i http://localhost:8010/api/uptime`.
   Expected: the first line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. [ ] Read the body.
   Expected: exactly two keys, for example `{"uptime_seconds":42.17,"started_at":"2026-11-18T22:05:34.123456+00:00"}`; `uptime_seconds` is an unquoted number and `started_at` is a quoted ISO 8601 date-time.
3. [ ] Run `curl -i -X POST http://localhost:8010/api/uptime` (edge case: the endpoint is read-only).
   Expected: status `405 Method Not Allowed`.

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

1. [ ] Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A).
   Expected: A is 0 or greater.
2. [ ] Wait about one second, then run the same command again and note `uptime_seconds` (call it B).
   Expected: B is 0 or greater and B is larger than A by roughly one second.
3. [ ] Run `uv run --directory backend pytest -q tests/integration/test_uptime_integration.py tests/unit/test_uptime_service_unit.py`.
   Expected: no failed or errored test and the command exits 0 (the uptime tests use no database).

## Criterion 3: `started_at` is captured once at startup, in UTC with an explicit offset

1. [ ] Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart.
   Expected: `started_at` is character-for-character identical in both responses while `uptime_seconds` differs.
2. [ ] Read the end of `started_at`.
   Expected: it ends in `+00:00`, not `Z` and not a local offset such as `+01:00`.
3. [ ] Run `docker compose restart backend`, then wait until `curl -s http://localhost:8010/api/uptime` answers again.
   Expected: `started_at` is a later timestamp than in step 1 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

1. [ ] Open `http://localhost:8010/docs` in a browser.
   Expected: the Swagger page lists `GET /api/uptime` under the `uptime` tag.
2. [ ] Expand `GET /api/uptime` and its 200 response.
   Expected: the schema is named `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string). Do not judge pass or fail on any `format` annotation for `started_at`; this feature makes no claim about it.
3. [ ] Open `backend/app/schemas/uptime.py` in the repository.
   Expected: it defines `class UptimeResponse(BaseModel)` with those two fields.

## Summary

| Criterion | Steps | Result (Pass / Fail) | Notes |
|---|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 3 | | |
| 2. Non-negative and increases a second apart | 3 | | |
| 3. Captured once, UTC with explicit offset | 3 | | |
| 4. Pydantic schema in `backend/app/schemas/` | 3 | | |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
