# UAT script: FEAT-1 Server time endpoint

No criterion is verifiable through the application's own UI: no frontend consumes `GET /api/time` or `GET /api/echo`. The observable check is the HTTP response itself, read with `curl`, plus FastAPI's Swagger UI at `/docs` for the schema criterion.

## Prerequisites

- [ ] Docker running.
- [ ] The stack is up: `docker compose up -d --build` from the repository root.
- [ ] `docker compose ps` shows the `backend` service running.
- [ ] A terminal with `curl`.
- [ ] The backend is published on the host at `http://localhost:8010` (from `docker-compose.yml`).

## Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First line reads `HTTP/1.1 200 OK`; headers include `content-type: application/json` | [ ] | [ ] |
| 1.2 | Read the body | A JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-11-13T06:43:27.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC` | [ ] | [ ] |

## Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/time` and note the `now` value | It ends in `+00:00` | [ ] | [ ] |
| 2.2 | Wait about one second, then run `curl -s http://localhost:8010/api/time` again | The new `now` is later than the first by roughly one second; the two values differ | [ ] | [ ] |
| 2.3 | Compare `now` with the current UTC time from `date -u` in the same terminal | The hour and minute match UTC, not your local time zone | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Extra prerequisite: a browser.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `http://localhost:8010/docs` | The Swagger UI lists `GET /api/time` under the `time` tag | [ ] | [ ] |
| 3.2 | Expand `GET /api/time` and read its `200` response | The schema link names `ServerTimeResponse` | [ ] | [ ] |
| 3.3 | Scroll to `Schemas` | `ServerTimeResponse` lists `now` (string, date-time) and `timezone` (`UTC`) | [ ] | [ ] |
| 3.4 | Open `backend/app/routers/server_time.py` in an editor | The handler returns `ServerTimeResponse(...)`, not a dict | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

Extra prerequisite: a database for the integration tier per `CLAUDE.md` Backing Services, with `DATABASE_URL` set (the server-time tests themselves need none).

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py tests/integration/test_echo_integration.py` | The summary line reports `0 failed` | [ ] | [ ] |
| 4.2 | Open `backend/tests/integration/test_server_time_integration.py` | It contains `test_get_time_now_is_computed_per_request` and `test_get_time_now_ends_with_plus_zero_offset`; `backend/tests/unit/test_server_time_unit.py` contains `test_server_time_response_serializes_now_with_plus_zero_offset` | [ ] | [ ] |

## Criterion 5: `GET /api/echo?msg={text}` returns 200 with `{"echo": "<msg>"}`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 5.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | `HTTP/1.1 200 OK` with body exactly `{"echo":"hello"}` | [ ] | [ ] |
| 5.2 | Run `curl -s "http://localhost:8010/api/echo?msg=%20hi%20"` | Body exactly `{"echo":" hi "}`: the spaces are kept | [ ] | [ ] |
| 5.3 | Run `curl -i http://localhost:8010/api/echo` | Status 422; the body's `detail[0]` has `"type":"missing"` and `"loc":["query","msg"]` | [ ] | [ ] |

## Criterion 6: the offset is pinned to `+00:00`, stated in the schema, and tested

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 6.1 | Run `curl -s http://localhost:8010/api/time` | `now` ends with exactly `+00:00` and contains no `Z` | [ ] | [ ] |
| 6.2 | Open `backend/app/schemas/server_time.py` | `UTC_OFFSET_SUFFIX = "+00:00"` is defined, the class docstring states the `+00:00` choice, and a `field_serializer` for `now` emits it | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. `GET /api/time` returns 200 with `now` and `timezone` | 1.1, 1.2 | [ ] Pass [ ] Fail |
| 2. `now` per request, UTC, never naive | 2.1 to 2.3 | [ ] Pass [ ] Fail |
| 3. Pydantic schema defines the body | 3.1 to 3.4 | [ ] Pass [ ] Fail |
| 4. Tests cover shape, offset, freshness | 4.1, 4.2 | [ ] Pass [ ] Fail |
| 5. `GET /api/echo?msg=...` returns `{"echo": ...}` | 5.1 to 5.3 | [ ] Pass [ ] Fail |
| 6. Offset pinned to `+00:00` | 6.1, 6.2 | [ ] Pass [ ] Fail |

Overall: [ ] Pass [ ] Fail

Tester: ______________  Date: ______________  Notes: ______________
