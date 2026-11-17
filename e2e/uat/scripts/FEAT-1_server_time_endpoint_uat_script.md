# UAT Script: FEAT-1 Server time endpoint

None of these criteria can be verified through the UI: both endpoints are backend-only with no frontend consumer. Each step gives a request and the response to read, against the backend on `http://localhost:8010`.

## Prerequisites
- The stack is up (`docker compose up -d` at the repo root) and the backend answers on port 8010.
- `uv` installed (criteria 4 and 5 run tests; no database needed for them).

## Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | Status line `HTTP/1.1 200 OK`; body is a JSON object with exactly two keys, `now` and `timezone` | [ ] | [ ] |
| 1.2 | Read `timezone` | Exactly `"UTC"` | [ ] | [ ] |
| 1.3 | Read `now` | Looks like `2026-11-17T18:12:20.123456+00:00`: date, `T`, time, ending `+00:00` (not `Z`, not without an offset) | [ ] | [ ] |

## Criterion 2: `now` is computed per request, in UTC, never naive
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/time`, wait about one second, run it again | Two bodies are printed | [ ] | [ ] |
| 2.2 | Compare the two `now` values | The second is later than the first by roughly one second; not identical | [ ] | [ ] |
| 2.3 | Compare each `now` with `date -u +%H:%M:%S` | Hour and minute match UTC, not local time; both values end `+00:00` | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `http://localhost:8010/docs` and expand `GET /api/time` | The 200 response schema is named `ServerTimeResponse`, with fields `now` (string, date-time) and `timezone` | [ ] | [ ] |
| 3.2 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema defines `ServerTimeResponse`, its `now` serializer's docstring names the `+00:00` choice; the router returns that model, not a dict | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] | [ ] |
| 4.2 | Open `backend/tests/integration/test_server_time_integration.py` | Contains `test_get_time_returns_200_with_now_and_utc_timezone` (shape), `test_get_time_now_ends_with_plus_zero_offset` (offset) and `test_get_time_computes_now_per_request` (freshness) | [ ] | [ ] |

## Criterion 5: `GET /api/echo?msg={text}` returns `{"echo": "<msg>"}`
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 5.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | Status `200 OK`, body `{"echo":"hello world"}` | [ ] | [ ] |
| 5.2 | Run `curl -i "http://localhost:8010/api/echo?msg=a%26b%20c"` | Status `200 OK`, body `{"echo":"a&b c"}` | [ ] | [ ] |
| 5.3 | Run `curl -i http://localhost:8010/api/echo` (no `msg`) | Status `422 Unprocessable Entity`, validation body naming the missing `msg` query parameter | [ ] | [ ] |
| 5.4 | Run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] | [ ] |

## Summary
| Criterion | Steps | Result |
|---|---|---|
| 1. Time returns 200 with `now` and `timezone` | 1.1 to 1.3 | [ ] Pass / [ ] Fail |
| 2. `now` per request, UTC, never naive | 2.1 to 2.3 | [ ] Pass / [ ] Fail |
| 3. Pydantic schema defines the body | 3.1 to 3.2 | [ ] Pass / [ ] Fail |
| 4. Tests cover shape, offset, freshness | 4.1 to 4.2 | [ ] Pass / [ ] Fail |
| 5. Echo endpoint | 5.1 to 5.4 | [ ] Pass / [ ] Fail |

Overall: [ ] PASS / [ ] FAIL    Tester: ________    Date: ________
