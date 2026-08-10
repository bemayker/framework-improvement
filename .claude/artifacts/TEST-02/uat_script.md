# UAT Script: TEST-02 Health endpoint

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-02-health-endpoint` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (the defaults are usable as-is for local UAT).
- No other process bound to the compose host ports `5442` (PostgreSQL), `8010` (backend), or `5183` (frontend). These are offset on purpose so the stack coexists with other local projects; a PostgreSQL on the default `5432` does not clash.
- `curl` on the PATH. A browser works too for the 200 case, but the 503 case is easier to read with `curl -i`, which shows the status line and the body together.
- No UI is involved in this feature. Every step below is an HTTP request against the backend; there is nothing to click and no `data-testid` to inspect.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build -d
   ```
2. Wait until `docker compose ps` reports `db` as `healthy` and `backend` as `running`. The backend only starts after the database passes its healthcheck, so a slow first boot is expected on a cold volume.
3. Keep a second terminal open on the repository root: several steps below stop and start the `db` service while you keep issuing requests.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/health` | Status line reads `HTTP/1.1 200 OK`, a `content-type: application/json` header is present, and the body is exactly `{"status":"ok"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:8010/api/health` in a browser instead | The browser shows the same `{"status":"ok"}` JSON. No login, header, or parameter is needed to read it | [ ] Pass [ ] Fail |
| 3 | Run `curl -i -X POST http://localhost:8010/api/health` | Status line reads `HTTP/1.1 405 Method Not Allowed`. The endpoint is read-only; no POST handler exists | [ ] Pass [ ] Fail |
| 4 | Stop only the database: `docker compose stop db`, then confirm with `docker compose ps` | `db` is reported as `exited`/stopped. `backend` is still running: it is not restarted by the database going away | [ ] Pass [ ] Fail |
| 5 | Run `time curl -i http://localhost:8010/api/health` | Status line reads `HTTP/1.1 503 Service Unavailable` and the body is exactly `{"status":"degraded"}` | [ ] Pass [ ] Fail |
| 6 | Read the elapsed time printed by step 5 | The response came back in roughly two seconds or less. The probe is bounded by a 2-second connect timeout, so an unreachable database never leaves the request hanging | [ ] Pass [ ] Fail |
| 7 | Run `docker compose logs --tail=20 backend` | A warning line records the failed connectivity probe with the driver's error type and message. No traceback and no HTTP 500: the probe never raises to the client | [ ] Pass [ ] Fail |
| 8 | Repeat step 5 twice more, a few seconds apart | Both calls answer 503 `{"status":"degraded"}` consistently. The verdict is not cached from the first healthy call in step 1 | [ ] Pass [ ] Fail |
| 9 | Start the database again: `docker compose start db`, then wait until `docker compose ps` reports `db` as `healthy` | `db` returns to `healthy`. The backend container was never restarted during steps 4 to 9 (its uptime in `docker compose ps` is unbroken) | [ ] Pass [ ] Fail |
| 10 | Run `curl -i http://localhost:8010/api/health` again | Status line reads `HTTP/1.1 200 OK` with body `{"status":"ok"}`. The service recovers on its own, because connectivity is evaluated per request | [ ] Pass [ ] Fail |
| 11 | Stop the frontend instead: `docker compose stop frontend`, then run `curl -i http://localhost:8010/api/health` | Still `HTTP/1.1 200 OK` with `{"status":"ok"}`. The health verdict covers the backend and its database only, and says nothing about the browser app. Restart it afterwards with `docker compose start frontend` | [ ] Pass [ ] Fail |
| 12 | In a separate terminal, run `cd backend && DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run pytest -q` | Backend unit and integration suites pass, including the health service unit tests and the health router integration tests (the integration tier talks to the compose `db` service on host port `5442`; the assignment must come *after* the `cd`, or it never reaches pytest) | [ ] Pass [ ] Fail |
| 13 | From the repository root, run `npx playwright test e2e/tests/TEST-02_health_endpoint.spec.ts` | Both specs pass: the 200 `{"status":"ok"}` contract and the 405 rejection of a POST | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}` | 1, 2, 13 |
| PostgreSQL unreachable → HTTP 503 with `{"status": "degraded"}` | 5, 7, 8, 12 |
| Edge case: the service recovers to 200 once PostgreSQL is back, with no backend restart | 9, 10 |
| Edge case: the verdict covers the backend and database only, not the frontend | 11 |
| Edge case: the probe is time-bounded, so a degraded answer arrives promptly | 6 |
| Contract: the endpoint is read-only (POST answers 405) | 3, 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
