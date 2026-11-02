# UAT Script: BUG-06 Health endpoint omits the Cache-Control no-store header

No criterion is verifiable through the UI: the item is backend only, so the observable check is the HTTP response itself, read with `curl`.

## Prerequisites

- The repository checked out locally on branch `feature/BUG-06-health-endpoint-omits-cache-control` (or, once merged, on `main`), `uv` installed, Docker running, and a terminal with `curl`.
- The backend runs locally at `http://localhost:8010` (`docker compose up -d --build` from the repo root, as `docker-compose.yml` publishes the backend on host port `8010`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` and `db` services report running.

## Steps

### Criterion 1: `GET /api/health` responses carry `Cache-Control: no-store`, status and body unchanged

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/health` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that same response | One header reads `cache-control: no-store` (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body | `{"status":"ok","database":{"host":"db","port":5432}}` (the host and port of the compose file's `DATABASE_URL`): the keys are exactly `status` and `database`, as before the fix | [ ] Pass [ ] Fail |
| 4 | Stop only the database with `docker compose stop db`, then run `curl -si http://localhost:8010/api/health` again | The status line reads `HTTP/1.1 503 Service Unavailable`, the body's `status` is `degraded`, and the response still carries `cache-control: no-store` | [ ] Pass [ ] Fail |
| 5 | Restart the database with `docker compose start db`, then run `curl -si http://localhost:8010/api/health` a third time | The response is back to `200 OK` and carries `cache-control: no-store` | [ ] Pass [ ] Fail |

### Criterion 2: A test reproduces the defect: it fails before the fix and passes after it

For the 200 test, `DATABASE_URL` must point at a running PostgreSQL (without it that test skips locally; the 503 test needs no database).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | On the feature branch, put back the pre-fix router with `git checkout origin/main -- backend/app/routers/health.py`, then from the repo root run `uv run --directory backend pytest tests/integration/test_health_cache_control_integration.py -q` | The run reports failures on the missing `cache-control` header (the 503 test fails even without a database) | [ ] Pass [ ] Fail |
| 7 | Restore the fixed router with `git checkout HEAD -- backend/app/routers/health.py` and run the same command | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 8 | Run `uv run --directory backend pytest -q tests/integration/test_health_integration.py tests/unit/test_health_service_unit.py` | The run ends with `0 failed`, showing the existing status and body assertions still hold | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
