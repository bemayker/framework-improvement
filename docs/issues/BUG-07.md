---
id: BUG-07
type: bug
title: Startup schema creation can crash or hang the app when the database is unreachable
severity: medium
status: todo
branch: feature/BUG-07-startup-schema-db-unreachable
depends_on: []
scaffold: false
---

## Description

`lifespan` in `backend/app/main.py:35-42` calls `ensure_schema(settings.database_url)` whenever `DATABASE_URL` is set. `ensure_schema` (`backend/app/core/db.py:66-68`) opens `psycopg.connect(target)` with no `connect_timeout` and no error handling. If the database is down or still starting when the backend boots:

- an unreachable host raises `psycopg.OperationalError` out of the lifespan, so the whole app fails to start (including `/api/version`, which the lifespan docstring says must keep answering without a database), and
- a blackholed host waits for the OS TCP timeout, so startup hangs, while `probe_connection` in the same module bounds its connect at 2 seconds for exactly this reason (`db.py:28-31`).

An unset `DATABASE_URL` is tolerated with a warning, but a set-and-down one is fatal, which is inconsistent.

## Evidence

```python
# backend/app/main.py
else:
    ensure_schema(settings.database_url)
yield

# backend/app/core/db.py
if isinstance(target, str):
    with psycopg.connect(target) as connection:
        _apply_schema(connection)
```

## Acceptance criteria

- [ ] Starting the backend with `DATABASE_URL` pointing at an unreachable database does not raise out of the lifespan; the app starts and `/api/version` answers.
- [ ] Startup schema creation uses a bounded connect timeout.
- [ ] The failure is logged with its reason, and the notes endpoints still fail loudly per request, or the schema is created once the database becomes reachable.

Fix direction: catch `psycopg.Error` around the startup call (log, continue) and pass `connect_timeout`; decide whether to retry lazily on the first notes request.
