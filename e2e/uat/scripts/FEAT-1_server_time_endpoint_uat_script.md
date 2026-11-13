# UAT script, FEAT-1: Server time endpoint

No criterion is verifiable through the UI: no frontend screen consumes `GET /api/time`. The observable check is the HTTP response, read with `curl` against the compose stack's backend on host port 8010 (the port `README.md` names), plus the test files run with `uv`.

## Prerequisites
- From the repository root, `docker compose up -d --build` has run and `docker compose ps` shows `backend` running (criteria 1 to 3).
- A terminal with `curl`.
- `uv` installed on the host for criterion 4; no database is needed for those files.
- Branch `feature/FEAT-1-server-time-endpoint` checked out.

## Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body | One JSON object with exactly two keys, `now` and `timezone`, e.g. `{"now":"2026-11-13T14:57:56.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC` | [ ] | [ ] |
| 1.3 | Edge case: run `curl -i -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` (the endpoint is read-only) | [ ] | [ ] |

## Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two JSON bodies are printed | [ ] | [ ] |
| 2.2 | Compare the two `now` values | Both end in `+00:00` (not `Z`, never without an offset); the second is about one second later than the first; they are not equal | [ ] | [ ] |
| 2.3 | Run `date -u +%Y-%m-%dT%H:%M:%S` on the host immediately after | The printed UTC time matches the second `now` to within a few seconds, so the value is UTC and not the host's local time | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `backend/app/schemas/server_time.py` | It defines `class ServerTimeResponse(BaseModel)` with fields `now` and `timezone` | [ ] | [ ] |
| 3.2 | Open `backend/app/routers/server_time.py` | The handler declares `response_model=ServerTimeResponse` and returns `ServerTimeResponse(...)`, with no dict literal built in the router | [ ] | [ ] |
| 3.3 | Run `curl -s http://localhost:8010/openapi.json \| grep -o 'ServerTimeResponse' \| head -1` | Prints `ServerTimeResponse`, showing the schema is what the API publishes for this route | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_service_unit.py tests/unit/test_server_time_schema_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` for those four files | [ ] | [ ] |
| 4.2 | Open `backend/tests/integration/test_server_time_integration.py` | It contains the shape test (`test_get_time_returns_200_with_now_and_utc_timezone`), the offset test (`test_get_time_now_carries_explicit_utc_offset`) and the freshness tests (`test_get_time_computes_now_per_request`, `test_get_time_now_does_not_go_backwards_between_requests`) | [ ] | [ ] |

## Summary
| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `now` and `timezone` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Per-request UTC time with explicit offset | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. Pydantic schema defines the body | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover shape, offset and freshness | 4.1 to 4.2 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
