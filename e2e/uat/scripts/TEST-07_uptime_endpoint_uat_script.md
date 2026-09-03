# UAT Script: TEST-07 Uptime endpoint

None of the four acceptance criteria is verifiable through the UI: no frontend consumes `GET /api/uptime`, so the observable check for each is the HTTP response itself, read with `curl` or a browser address bar. Two criteria (2 and 4) are also about the endpoint's *declaration* rather than its behaviour, so they are additionally read off the OpenAPI document the backend serves at `/openapi.json`, which is where a bound hand-rolled in the handler would fail to appear.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`, service `backend`.
- The `db` service state is irrelevant to this endpoint: `GET /api/uptime` opens no database connection and answers whether or not PostgreSQL is up. Do not stop or start `db` for this script.
- No root `.env` file is required. `docker-compose.yml` carries usable defaults for every variable it substitutes.
- A terminal with `curl`. `python3 -m json.tool` (or `jq`) is convenient for reading `/openapi.json`, but every check below can be made by eye on the raw response.
- A browser, for the optional steps 3 and 18.
- Steps 7, 12, 14 and 15 read files in the checked-out repository; no build or tooling is needed for them.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Let the stack run for at least a minute before starting: step 13 compares a several-minute uptime against a freshly restarted one, and that contrast is easier to read when the first value is not itself small.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i "http://localhost:8010/api/uptime"` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | A JSON object with exactly two keys, in the shape `{"uptime_seconds":12.345678,"started_at":"2026-09-03T13:05:12.345678+00:00"}` — your number and timestamp will differ. `uptime_seconds` is an unquoted number, `started_at` is a quoted timestamp string, and there is no third field | [ ] Pass [ ] Fail |
| 3 | (Optional) Open `http://localhost:8010/api/uptime` in a browser | The page shows the same two-field JSON object | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart

Prerequisites: criterion 1 just verified, stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s "http://localhost:8010/api/uptime"; echo; sleep 1; curl -s "http://localhost:8010/api/uptime"; echo` | Two JSON lines are printed, one second apart | [ ] Pass [ ] Fail |
| 5 | Compare the two `uptime_seconds` values | Both are `>= 0`, and the second is larger than the first by roughly one second (for example `41.207113` then `42.219850`). Neither is negative and neither repeats the other | [ ] Pass [ ] Fail |
| 6 | Run `curl -s http://localhost:8010/openapi.json` and locate `components` → `schemas` → `UptimeResponse` → `properties` → `uptime_seconds` | It carries `"type":"number"` and `"minimum":0`. This is the declared bound; a check hand-rolled in the handler would not appear here | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/uptime.py` in the repository | The handler body is a `uptime_service.get_uptime()` call and a `return UptimeResponse(...)`; it contains no `< 0` comparison, no `max(` clamp and no `HTTPException`. The bound lives in the schema's `Field(ge=0)` instead | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset

Prerequisites: stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `curl -s "http://localhost:8010/api/uptime"; echo; curl -s "http://localhost:8010/api/uptime"; echo` | Two JSON lines. The two `started_at` values are character-for-character identical (the value is captured once, not per request), while the two `uptime_seconds` values differ — which is what shows the identical timestamp is not simply a cached response | [ ] Pass [ ] Fail |
| 9 | Read the `started_at` string | It has the shape `2026-09-03T13:05:12.345678+00:00`: a date, a `T`, a time with fractional seconds, and the explicit offset `+00:00` at the end. It does **not** end in `Z` and it is **not** missing an offset. (The fractional part is dropped only in the astronomically unlikely case of a whole-microsecond capture; the trailing `+00:00` is the part that matters) | [ ] Pass [ ] Fail |
| 10 | Run `date -u +%Y-%m-%dT%H:%M` in the same terminal | The printed UTC date and hour match those of `started_at` (which is the moment the backend container last started, so the minutes differ by however long the stack has been up). On a machine in UTC+2, `date +%H` without `-u` would read two hours higher than `started_at`, which is what confirms the reported value is UTC rather than local time | [ ] Pass [ ] Fail |
| 11 | Run `curl -s http://localhost:8010/openapi.json` and locate `components` → `schemas` → `UptimeResponse` → `properties` → `started_at` | It carries `"type":"string"` and `"format":"date-time"` — the timestamp is declared as a date-time in the contract, not as a free-form string | [ ] Pass [ ] Fail |
| 12 | Open `backend/app/services/uptime_service.py` in the repository | `STARTED_AT = datetime.now(timezone.utc)` is a module-level assignment (executed once, when the process imports the module), and `get_uptime()` reads `STARTED_AT` without reassigning it. Elapsed time comes from `monotonic() - _STARTED_MONOTONIC`, not from subtracting two wall-clock readings | [ ] Pass [ ] Fail |

### Edge case: a backend restart moves `started_at` later and resets `uptime_seconds`

Prerequisites: stack still up and up for at least a minute, so the pre-restart `uptime_seconds` is clearly larger than the post-restart one.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Note the current `started_at` and `uptime_seconds`, then run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, and run `curl -s "http://localhost:8010/api/uptime"; echo` | `started_at` is a **later** timestamp than the one noted, and `uptime_seconds` is a small value of a few seconds rather than the noted one. This is the restart an operator is meant to be able to see without reading container logs | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: stack still up (restarted at step 13 is fine); repository checked out.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | Open `backend/app/schemas/uptime.py` in the repository | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` method returning `value.astimezone(timezone.utc).isoformat()` | [ ] Pass [ ] Fail |
| 15 | Open `backend/app/routers/uptime.py` | The route decorator reads `@router.get("/uptime", response_model=UptimeResponse)` and the handler returns `UptimeResponse(uptime_seconds=..., started_at=...)`, not a dict literal | [ ] Pass [ ] Fail |
| 16 | Run `curl -s http://localhost:8010/openapi.json` and locate `paths` → `/api/uptime` → `get` → `responses` → `200` → `content` → `application/json` → `schema` | It reads exactly `{"$ref":"#/components/schemas/UptimeResponse"}` — the body is declared by a named component, which a bare dict response could not produce | [ ] Pass [ ] Fail |
| 17 | In the same document, locate `components` → `schemas` → `UptimeResponse` | It exists, with `properties.uptime_seconds` (`"type":"number"`, `"minimum":0`), `properties.started_at` (`"type":"string"`, `"format":"date-time"`), and `"required":["uptime_seconds","started_at"]` listing both fields | [ ] Pass [ ] Fail |
| 18 | (Optional) Open `http://localhost:8010/docs` in a browser and, under the `uptime` tag, expand `GET /api/uptime` | The 200 response's "Example Value \| Schema" toggle names the schema `UptimeResponse` and shows both fields | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Result | Notes |
|-----------|-------|--------|-------|
| 1. 200 with `uptime_seconds` and `started_at` | 1-3 | [ ] Pass [ ] Fail | |
| 2. `uptime_seconds` non-negative and increasing a second apart, bound declared | 4-7 | [ ] Pass [ ] Fail | |
| 3. `started_at` captured once at startup, UTC with an explicit `+00:00` offset | 8-12 | [ ] Pass [ ] Fail | |
| 4. Response body defined by a Pydantic schema in `backend/app/schemas/` | 14-18 | [ ] Pass [ ] Fail | |
| Edge case: a backend restart moves `started_at` and resets `uptime_seconds` | 13 | [ ] Pass [ ] Fail | |

| Item | Result |
|------|--------|
| Total steps | 18 (16 required, 2 optional browser checks: 3 and 18; steps 6, 11, 16 and 17 may also be read in a browser) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
