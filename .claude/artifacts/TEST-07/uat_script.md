# UAT Script: TEST-07 Uptime endpoint

This feature has no screen in the app. Every check runs against the backend directly, in the browser's address bar, in `curl`, in FastAPI's interactive docs (Swagger UI) and with `docker compose`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A browser and a terminal with `curl`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Open `http://localhost:8010/api/version`; it shows a `version` value, confirming the backend answers on port 8010.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a browser, open `http://localhost:8010/api/uptime` | A JSON object with exactly two keys, for example `{"uptime_seconds": 42.81, "started_at": "2026-10-05T09:14:02.118734+00:00"}`; `uptime_seconds` is a bare number (no quotes) and `started_at` is a quoted date-time | [ ] Pass [ ] Fail |
| 2 | In a terminal run `curl -i http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/docs`, expand `GET /api/uptime`, click "Try it out" then "Execute" | "Server response" shows Code `200` and a body with the same two keys | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:8010/api/uptime` and write down `uptime_seconds` (for example `42.81`) | The value is 0 or greater, never negative | [ ] Pass [ ] Fail |
| 5 | Wait about one second, then reload the page | `uptime_seconds` is larger than the value written down, by roughly the time waited (for example `43.86`) | [ ] Pass [ ] Fail |
| 6 | In a terminal run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | The second line's `uptime_seconds` exceeds the first line's by about 1 | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/api/uptime` and copy the full `started_at` value | It ends in `+00:00` (not `Z`, not a local offset such as `+02:00`, and not missing an offset) | [ ] Pass [ ] Fail |
| 8 | Reload the page three times | `started_at` is character-for-character identical every time while `uptime_seconds` keeps growing (it is not the current time of each request) | [ ] Pass [ ] Fail |
| 9 | Check consistency: compare `started_at` plus `uptime_seconds` with `date -u` in a terminal | The sum is approximately the current UTC time | [ ] Pass [ ] Fail |
| 10 | In a terminal run `docker compose restart backend`, wait until `http://localhost:8010/api/version` answers again, then open `http://localhost:8010/api/uptime` | `started_at` is a later time than the value copied in step 7, still ending in `+00:00`, and `uptime_seconds` is small (a few seconds), showing the restart | [ ] Pass [ ] Fail |

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `http://localhost:8010/docs` and expand `GET /api/uptime` | Under Responses, `200` shows an example value with `uptime_seconds` and `started_at`, and its Schema tab names `UptimeResponse` | [ ] Pass [ ] Fail |
| 12 | Scroll to the "Schemas" section at the bottom and expand `UptimeResponse` | It lists two required properties: `uptime_seconds` (number, minimum 0) and `started_at` (string). Swagger shows `started_at` as a plain string without a `date-time` format; that is expected (the `+00:00` serializer determines the documented type) and is not a defect | [ ] Pass [ ] Fail |
| 13 | Not verifiable further through a UI: open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` | `class UptimeResponse(BaseModel)` is defined in the schemas module and the router returns `UptimeResponse(...)` with no dict literal | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with `uptime_seconds` and `started_at` | 1-3 | [ ] Pass [ ] Fail |
| 2. Non-negative and increasing | 4-6 | [ ] Pass [ ] Fail |
| 3. Captured once, UTC with offset | 7-10 | [ ] Pass [ ] Fail |
| 4. Pydantic schema | 11-13 | [ ] Pass [ ] Fail |

Overall: [ ] Pass [ ] Fail

Tester: ____________  Date: ____________
