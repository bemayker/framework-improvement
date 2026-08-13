# UAT Script: TEST-02 Health endpoint

Neither acceptance criterion is verifiable through the UI: no frontend consumes `GET /api/health`, so the observable check is the HTTP response itself, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-02-health-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database). Both mappings come from `docker-compose.yml`; `5442` is the *host-published* mapping of PostgreSQL's container port `5432`, which is what makes step 2's "resolved, not configured" check meaningful.
- No root `.env` file is required. `docker-compose.yml` carries usable defaults for every variable it substitutes and sets the backend's `DATABASE_URL` itself (`postgresql://tasknotes:tasknotes@db:5432/tasknotes`). Copying `.env.example` to `.env` is harmless but changes nothing for this script.
- A terminal with `curl`.
- Step 7 only (optional edge case): `uv` installed on the host and the backend dependencies synced (`cd backend && uv sync`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/health` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"status":"ok","database":{"host":"db","port":5432}}`. `status` is `ok`, and `database.host` / `database.port` are the values the backend actually connected with inside the compose network (`db`, `5432`), **not** the host-published port `5442` — the "resolved, not configured" behaviour the tracker comment asks for | [ ] Pass [ ] Fail |

### Criterion 2: when PostgreSQL is unreachable the endpoint returns HTTP 503 with `{"status": "degraded"}`

Prerequisites: criterion 1 just verified, stack still up.

> **Do not restart or rebuild the `backend` service while `db` is stopped.** The application's startup lifespan runs `ensure_schema()` and raises when `DATABASE_URL` is set but the database cannot be reached, so a backend restarted at that moment would fail to boot (and, under `restart: unless-stopped`, keep retrying). This is pre-existing TEST-03 startup behaviour, unrelated to the runtime health reporting under test here. Steps 3 to 6 deliberately leave the backend running throughout.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `docker compose stop db` | The command reports the `db` container stopped | [ ] Pass [ ] Fail |
| 4 | Run `curl -i http://localhost:8010/api/health` | The first response line reads `HTTP/1.1 503 Service Unavailable`, returned promptly — at most about 2 seconds (the probe's connect timeout is the upper bound; with the container stopped the probe usually fails sooner, on name resolution). It must never hang | [ ] Pass [ ] Fail |
| 5 | Read the response body | `{"status":"degraded","database":{"host":"db","port":5432}}`: `status` is `degraded` and `database` still names the attempted target | [ ] Pass [ ] Fail |
| 6 | Run `docker compose start db`, wait for `docker compose ps` to show `db` healthy again, then re-run `curl -i http://localhost:8010/api/health` | `HTTP/1.1 200 OK` with `{"status":"ok","database":{"host":"db","port":5432}}`, confirming recovery without a backend restart | [ ] Pass [ ] Fail |

### Edge case (optional): the backend runs with no `DATABASE_URL`

Covers the corresponding Gherkin scenario. It cannot be exercised through the compose stack, which always sets `DATABASE_URL`, so it runs the backend directly on the host on a spare port. The compose stack from steps 1 to 6 may stay up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | In one terminal run `cd backend && env -u DATABASE_URL uv run uvicorn app.main:create_app --factory --port 8011`; in a second terminal run `curl -i http://localhost:8011/api/health`, then stop the server with Ctrl-C | The server starts and logs a warning that schema initialisation was skipped because `DATABASE_URL` is not set. The request answers `HTTP/1.1 503 Service Unavailable` with body `{"status":"degraded","database":{"host":null,"port":null}}` — degraded with no target to name | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 (6 required, 1 optional edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
