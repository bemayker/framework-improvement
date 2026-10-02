# UAT Script: TEST-07 Uptime endpoint

No criterion is verifiable through the application UI: no frontend page calls `/api/uptime`. Every check reads the HTTP response in a terminal with `curl` (or a browser address bar on the API URL), plus the API docs page for criterion 4.

Mark each step `[x]` for pass or `[ ]` left open with a note for fail.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

Prerequisites: Docker running; repository on branch `feature/TEST-07-uptime-endpoint`; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows `backend` running; host port 8010 free; a terminal with `curl` and `python3`.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` | First line reads `HTTP/1.1 200 OK`; headers include `content-type: application/json` | [ ] | [ ] |
| 1.2 | Read the body of the same response | JSON object with exactly two keys, for example `{"uptime_seconds":37.204,"started_at":"2026-10-02T10:42:41.123456+00:00"}`; `uptime_seconds` is an unquoted number, `started_at` a quoted string | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/api/uptime` in a browser address bar | Browser shows the same two-key JSON object | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: the backend from Criterion 1 is running.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON bodies print one after the other | [ ] | [ ] |
| 2.2 | Compare the two `uptime_seconds` values | Both are 0 or greater; the second is larger than the first by roughly 1 (for example 41.02 then 42.03) | [ ] | [ ] |
| 2.3 | Run `docker compose restart backend`, wait until it is running again, then `curl -s http://localhost:8010/api/uptime` | `uptime_seconds` is a small non-negative number (a few seconds), never negative | [ ] | [ ] |

## Criterion 3: `started_at` is captured once at startup, not per request, and serialised in UTC with an explicit offset

Prerequisites: the backend from Criterion 1 is running; note the time the container last started.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` three times, a few seconds apart | `started_at` is character-for-character identical in all three responses while `uptime_seconds` grows | [ ] | [ ] |
| 3.2 | Read the end of the `started_at` value | It ends with the explicit offset `+00:00` (not a bare time, not a local offset such as `+02:00`) | [ ] | [ ] |
| 3.3 | Compare `started_at` with the current UTC time from `date -u` | `started_at` is earlier than now, and now minus `started_at` approximately equals `uptime_seconds` | [ ] | [ ] |
| 3.4 | Run `docker compose restart backend`, wait until it is running, then `curl -s http://localhost:8010/api/uptime` | `started_at` has changed to a later instant (the restart time) and `uptime_seconds` has dropped back to a few seconds | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the backend from Criterion 1 is running.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response schema is named `UptimeResponse` | [ ] | [ ] |
| 4.2 | In the Schemas section at the bottom expand `UptimeResponse` | It lists `uptime_seconds` (number, minimum 0) and `started_at` (string). Do not expect a `date-time` format on `started_at`: the custom serialiser documents a plain string; the wire value is checked in step 3.2 | [ ] | [ ] |
| 4.3 | Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` in an editor | `class UptimeResponse(BaseModel)` defines the two fields, and the router declares `response_model=UptimeResponse` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Non-negative, increases a second apart | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. Captured once at startup, UTC with `+00:00` | 3.1 to 3.4 | [ ] Pass  [ ] Fail |
| 4. Pydantic schema in `backend/app/schemas/` | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
