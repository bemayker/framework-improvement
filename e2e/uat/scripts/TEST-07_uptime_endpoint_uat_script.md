# UAT Script: TEST-07 Uptime endpoint

This feature has no UI. Every criterion is verified against the HTTP response of `http://localhost:8010/api/uptime`, read either in the browser (which renders a JSON response body directly) or with `curl`, which is how the status code and response headers are read exactly. Both routes are given per criterion; either one is sufficient unless a step says otherwise.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- The stack is up (`docker compose up -d --build` from the repository root) and the backend answers on `http://localhost:8010`; confirm with `http://localhost:8010/api/version`, which must render a JSON body containing a `version` key.
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`.
- `docker compose ps` available to confirm `db` is healthy and `backend` is running (needed for the restart step, criterion 3's edge-case counterpart below).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i "http://localhost:8010/api/uptime"` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the body printed by that same command | It is a single JSON object with exactly two keys, for example `{"uptime_seconds":12.345,"started_at":"2026-09-20T09:14:02.481293+00:00"}`. `uptime_seconds` is a bare number with no quotes around it, `started_at` is a quoted string, and there is no third key | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/uptime` in the browser | The page renders the same two-key JSON object and nothing else | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: same as criterion 1, and the backend has not been restarted since criterion 1's steps.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | In a terminal, run `curl -s "http://localhost:8010/api/uptime"` and write down the `uptime_seconds` value | It is a number greater than or equal to 0, never negative and never a quoted string | [ ] Pass [ ] Fail |
| 5 | Wait at least two seconds, then run `curl -s "http://localhost:8010/api/uptime"` again and write down the new `uptime_seconds` | The second number is larger than the first by at least 1, and the difference is roughly the number of seconds you waited (a two-second wait gives a difference of about 2) | [ ] Pass [ ] Fail |
| 6 | In a terminal, run `curl -s "http://localhost:8010/api/uptime"` three times in a row with no wait between them | The three `uptime_seconds` values are non-decreasing (each one greater than or equal to the previous), confirming the number never runs backwards | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset

Prerequisites: same as criterion 1, and the backend has not been restarted since criterion 2's steps.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | In a terminal, run `curl -s "http://localhost:8010/api/uptime"` and copy the full `started_at` value, for example `2026-09-20T09:14:02.481293+00:00` | The string ends with the literal five characters `+00:00`. It must not end with `Z`, and it must not end with the digits alone and no offset at all | [ ] Pass [ ] Fail |
| 8 | Wait at least five seconds, then run `curl -s "http://localhost:8010/api/uptime"` again and compare its `started_at` with the value you copied | The two strings are identical, character for character, microseconds included. A value that changed between the two calls would mean the instant is recomputed per request | [ ] Pass [ ] Fail |
| 9 | In a terminal, run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s "http://localhost:8010/api/uptime"` | `started_at` is now a later time than the value you copied in step 7, and `uptime_seconds` has dropped back to a small number (under 60). This is the observable check that the instant is tied to application startup rather than to a build-time constant or to the request | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

This criterion is structural and cannot be fully verified through a running UI; three observable checks stand in for it.

Prerequisites: same as criterion 1, plus the repository open in an editor.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `http://localhost:8010/openapi.json` in the browser and search for `UptimeResponse` | The schema is present under `components.schemas` with the properties `uptime_seconds` (type `number`) and `started_at` (type `string`, carrying the annotation `"format": "date-time"`), and the 200 response of `/api/uptime` references it. A bare dict return would produce no named schema here | [ ] Pass [ ] Fail |
| 11 | Open `http://localhost:8010/docs` in the browser and expand `GET /api/uptime` | The example response shows both fields under the `UptimeResponse` model name | [ ] Pass [ ] Fail |
| 12 | Open `backend/app/schemas/uptime.py` in the repository | The file exists and defines `class UptimeResponse(BaseModel)` with those two fields, and `backend/app/routers/uptime.py` names it as `response_model=UptimeResponse` on the route decorator | [ ] Pass [ ] Fail |

### Edge case: a backend restart resets `uptime_seconds` and moves `started_at` forward

Covered by step 9 above (the `docker compose restart backend` step), which belongs to criterion 3's verification and is not repeated here as a separate step.

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
