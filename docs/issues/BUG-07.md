---
id: BUG-07
type: bug
title: Unreachable database at startup crashes the app instead of letting /api/health report degraded
severity: low
status: todo
depends_on: []
---

## Description

`lifespan` in `backend/app/main.py:35-42` calls `ensure_schema(settings.database_url)` whenever `DATABASE_URL` is set. `ensure_schema` (`backend/app/core/db.py:66-68`) opens `psycopg.connect(target)` with no `connect_timeout` and no error handling. If the database is unreachable at boot (restart during a DB outage, wrong host), the exception propagates out of the lifespan and the whole application fails to start.

This contradicts the intent stated in the same lifespan docstring (startup must not hard-require a database so endpoints that need none still answer) and the purpose of `GET /api/health` (`backend/app/services/health_service.py:36-64`), which is built to answer 503 "degraded" when the database is down. After a restart with the database down, the process never serves, so health cannot report anything. The unset-`DATABASE_URL` case is handled gracefully (warning, skip); the set-but-unreachable case is not. Docker Compose masks this locally (`depends_on: service_healthy`, `restart: unless-stopped`) but other deployments do not have that.

Related: the connect in `ensure_schema` and in `get_connection` (`db.py:93`) has no `connect_timeout`, unlike `probe_connection` (`db.py:47-49`), so an unreachable host stalls on the OS TCP timeout.

## Evidence

```python
# backend/app/main.py
    if settings.database_url is None:
        logger.warning(...)
    else:
        ensure_schema(settings.database_url)   # raises psycopg.OperationalError if DB is down
    yield
```

## Acceptance criteria

- [ ] With `DATABASE_URL` set to an unreachable database, the application starts and `GET /api/version` answers 200.
- [ ] In that state `GET /api/health` answers 503 with the degraded payload.
- [ ] The startup failure is logged with its reason, and the notes table is still created when the database is reachable.
- [ ] A unit or integration test covers the unreachable-database startup.

Suggested direction: catch `psycopg.Error` around `ensure_schema` in `lifespan`, log it, and continue; optionally bound the connect with a timeout. Decide separately whether the schema should be retried lazily.
