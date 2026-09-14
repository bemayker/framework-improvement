# UAT Script: TEST-07 Uptime endpoint

None of the four acceptance criteria is verifiable through the application's UI: no frontend consumes `GET /api/uptime`. The observable check is the HTTP response itself, read with `curl`, plus FastAPI's generated Swagger UI at `/docs` for criterion 4, which a person can read in a browser. Two steps (3.5 and 4.5) read source files, because the "captured once at startup" half of criterion 3 and the "defined by a Pydantic schema, not a bare dict" half of criterion 4 are observable there as well as over HTTP. The feature's edge case — a restart moves `started_at` and resets `uptime_seconds` — is covered by steps 2.3 and 3.4.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- No root `.env` file is required. `docker-compose.yml` carries usable defaults for every variable it substitutes and sets the backend's `DATABASE_URL` itself.
- A terminal with `curl`, and a browser for criterion 4 steps 4.1 to 4.3.
- **The `db` service is irrelevant to this endpoint but is still needed to start the stack.** `GET /api/uptime` opens no database connection and answers whether or not PostgreSQL is reachable, exactly as `GET /api/echo`, `GET /api/time` and `GET /api/version` do. The compose `backend` service nevertheless declares `depends_on: db: condition: service_healthy`, so the container will not start until `db` reports healthy. Bring the whole stack up as below and ignore `db` from then on.
- Steps 2.3 and 3.4 restart the backend container. Run them in the order given: every earlier step in a block assumes the process has not restarted since that block began.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | In a terminal, run `curl -i http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 1.2 | Read the response body | A JSON object with exactly two keys, in the shape `{"uptime_seconds":83.417205,"started_at":"2026-09-14T09:51:03.412876+00:00"}`: `uptime_seconds` is a bare number written without quotes, and `started_at` is a quoted ISO 8601 timestamp with a date, a `T` separator, a time and a `+00:00` suffix. No other key is present | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: the shared prerequisites above; criterion 1 just verified, stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime` and note the `uptime_seconds` value | A value such as `83.417205`. It is zero or greater, never a negative number. Write it down; steps 2.2 and 2.3 compare against it | [ ] Pass [ ] Fail |
| 2.2 | Run `sleep 1`, then run `curl -s http://localhost:8010/api/uptime` again | The new `uptime_seconds` is strictly larger than the value noted in step 2.1, by at least one second (for example `84.9` against `83.4`), and is still non-negative | [ ] Pass [ ] Fail |
| 2.3 | Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` | `uptime_seconds` is small — a few seconds at most — and smaller than the value seen in step 2.2. The counter restarted with the process, which is the restart-versus-long-lived distinction the feature exists to make (the feature's edge case) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset

Prerequisites: the shared prerequisites above. The stack is still up, and the backend has just restarted in step 2.3; that is fine, this block only needs the process to stay up from step 3.1 to step 3.3.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` and note the `started_at` string | A value of the form `2026-09-14T09:51:03.412876+00:00`. It ends with the literal six characters `+00:00`, not the letter `Z`, and not a bare time with no offset at all (a naive value would end in `...03.412876` with nothing after it). Write it down | [ ] Pass [ ] Fail |
| 3.2 | Wait a few seconds, then run `curl -s http://localhost:8010/api/uptime` again | `started_at` is byte-for-byte identical to step 3.1 while `uptime_seconds` has grown. The timestamp was captured once at startup and is not recomputed per request — a per-request clock read would produce a different string every time | [ ] Pass [ ] Fail |
| 3.3 | Run `date -u` in the terminal and compare it with `started_at` plus the `uptime_seconds` of step 3.2 | The current UTC time is later than `started_at` by roughly `uptime_seconds`, to within a few seconds. The value is in UTC rather than the host's local zone — so on a host that is not on UTC, `started_at` disagrees with `date` (local) and agrees with `date -u` | [ ] Pass [ ] Fail |
| 3.4 | Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is now a later timestamp than the one noted in step 3.1, because the process restarted, and it still ends with `+00:00` (the feature's edge case, seen from the timestamp side) | [ ] Pass [ ] Fail |
| 3.5 | Open `backend/app/routers/uptime.py` in an editor | `STARTED_AT` is assigned once at module level with `datetime.now(timezone.utc)`, beside `STARTED_AT_MONOTONIC = time.monotonic()`, and the handler body reads both without reassigning either. Elapsed time is computed on the monotonic clock, so a wall-clock correction cannot make `uptime_seconds` negative or make it decrease. This is the "captured once at startup" half in source, matching what steps 3.2 and 3.4 show over HTTP | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the shared prerequisites above, including a browser. Stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | Open `http://localhost:8010/docs` in the browser | The Swagger UI lists a `GET /api/uptime` operation under the `uptime` tag | [ ] Pass [ ] Fail |
| 4.2 | Expand `GET /api/uptime` and read its `200` response | The schema link names `UptimeResponse` and the body has the keys `uptime_seconds` (a number) and `started_at` (a string). Swagger shows **no** `format` beside `started_at`: the schema module annotates its `field_serializer` `-> str`, and pydantic derives a field's serialisation-mode schema from that return type, so the generated schema says `string` and nothing more. The value on the wire is still the ISO 8601 UTC timestamp criterion 3 checks. The operation takes no parameters | [ ] Pass [ ] Fail |
| 4.3 | Scroll to the `Schemas` section at the bottom of the page and expand `UptimeResponse` | It has exactly two required properties: `uptime_seconds`, of type `number` with minimum `0`, and `started_at`, of type `string` with **no** `format` annotation (see step 4.2 for why). Expecting `date-time` here reads the intent rather than the generated schema; step 4.4's `openapi.json` is the authoritative form of this check, and the timestamp's actual shape is pinned by criterion 3 | [ ] Pass [ ] Fail |
| 4.4 | In a terminal, run `curl -s http://localhost:8010/openapi.json` and read the JSON | At `paths."/api/uptime".get.responses."200".content."application/json".schema."$ref"` the value is `#/components/schemas/UptimeResponse`, and `components.schemas.UptimeResponse.properties` has exactly the two keys `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 4.5 | Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` in an editor | The schema module defines `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `field_serializer` for `started_at` returning `value.astimezone(timezone.utc).isoformat()` — which is where the `+00:00` of criterion 3 comes from, pydantic's own default writing UTC as `Z`. The router declares `response_model=UptimeResponse` and returns an instance of that model, not a dict literal. `backend/app/services/` contains no `uptime_service.py` — that is the planned deviation from `coding_standards.md` Section 2.2 recorded in the plan and in the PR description, not an omission | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 (2 + 3 + 5 + 5) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
