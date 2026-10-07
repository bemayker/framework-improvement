# UAT script, TEST-13: Ping endpoint

This feature has no UI: no screen calls `/api/ping`. Each criterion is verified in a browser tab pointed at the backend or with `curl`.

## Prerequisites
- The stack is running (`docker compose up -d --build` from the repo root) and the backend answers on `http://localhost:8010` (the host port `docker-compose.yml` maps; if a handover rebuild moved it, use the port the handover report names).
- For Criterion 3: branch `feature/TEST-13-ping-endpoint` checked out, `uv` installed, and a PostgreSQL instance reachable with `DATABASE_URL` set (the notes integration tests need it; without it they skip locally rather than fail).

## Criterion 1: `GET /api/ping` returns 200 with `{"pong": true}`
1. [ ] Open `http://localhost:8010/api/ping` in a browser tab.
   Expected: the page shows the JSON `{"pong":true}`, with `true` unquoted (a boolean, not a string).
   Result: [ ] Pass [ ] Fail
2. [ ] Run `curl -i http://localhost:8010/api/ping`.
   Expected: first line `HTTP/1.1 200 OK`, a `content-type: application/json` header, body `{"pong":true}`.
   Result: [ ] Pass [ ] Fail
3. [ ] Edge case: run `curl -i -X POST http://localhost:8010/api/ping`.
   Expected: the first line shows status `405 Method Not Allowed`.
   Result: [ ] Pass [ ] Fail

## Criterion 2: the endpoint is listed in the OpenAPI schema at `/openapi.json`
1. [ ] Open `http://localhost:8010/openapi.json` in a browser tab.
   Expected: the `paths` object contains the key `/api/ping`, with a `get` entry tagged `ping`.
   Result: [ ] Pass [ ] Fail
2. [ ] In the same document, find `components` > `schemas` > `PingResponse`.
   Expected: `properties.pong.type` is `boolean`, and `required` lists `pong`.
   Result: [ ] Pass [ ] Fail
3. [ ] Open `http://localhost:8010/docs`, expand `GET /api/ping` in the `ping` section, click "Try it out" then "Execute".
   Expected: response code 200 and response body `{"pong": true}`.
   Result: [ ] Pass [ ] Fail

## Criterion 3: the full backend test suite passes with the new tests included
1. [ ] From the repo root run `uv run --directory backend pytest -q`.
   Expected: the summary line reports `0 failed` and no errors.
   Result: [ ] Pass [ ] Fail
2. [ ] Run `uv run --directory backend pytest -q tests/unit/test_ping_unit.py tests/integration/test_ping_integration.py tests/unit/test_main_unit.py`.
   Expected: the ping tests and the route-registration test in `test_main_unit.py` are collected and the summary reports `0 failed`.
   Result: [ ] Pass [ ] Fail
3. [ ] On the implementation PR, open the Checks tab.
   Expected: the `pr-tests` check is green, with its unit and integration jobs passed.
   Result: [ ] Pass [ ] Fail

## Summary
| # | Criterion | Steps | Result |
|---|---|---|---|
| 1 | `GET /api/ping` returns 200 with `{"pong": true}` | 1.1 to 1.3 | [ ] Pass [ ] Fail |
| 2 | Listed in `/openapi.json` | 2.1 to 2.3 | [ ] Pass [ ] Fail |
| 3 | Full backend suite passes | 3.1 to 3.3 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail
