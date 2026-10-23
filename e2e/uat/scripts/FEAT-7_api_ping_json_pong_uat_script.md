# UAT Script: FEAT-7 GET /api/ping returns a JSON pong

`GET /api/ping` answers with HTTP 200 and the JSON body `{"pong": true}`. No UI consumes the endpoint, so every step is checked with `curl`, the OpenAPI document and the test suite against the running backend.

## Prerequisites

- Docker is running.
- Repository checked out on `feature/FEAT-7-api-ping-json-pong`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010`.
- A terminal with `curl` and `uv`.

## Criterion 1: `GET /api/ping` responds with HTTP 200 and the JSON body `{"pong": true}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/ping` | First line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers | [ ] | [ ] |
| 1.2 | Read the body printed by step 1.1 | Exactly `{"pong":true}`, with `true` unquoted (a boolean, not the string `"true"`) and no other field | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/ping` under the `ping` tag | The documented 200 response schema is `PingResponse` with one boolean field `pong` | [ ] | [ ] |

## Criterion 2: the endpoint is covered by one pytest test, which passes

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py` | The run collects the single test `test_get_ping_returns_200_with_pong_true` and reports `0 failed` | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_ping_integration.py` | It holds exactly one test function, and that function asserts both the 200 status and the body `{"pong": True}` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `{"pong": true}` | 1.1 to 1.3 | | |
| 2. One passing pytest test | 2.1 to 2.2 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
