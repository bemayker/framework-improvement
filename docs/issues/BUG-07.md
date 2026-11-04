---
id: BUG-07
type: bug
title: App fails to start when the database is unreachable at boot
severity: low
status: todo
branch: feature/BUG-07-startup-unreachable-database
depends_on: []
scaffold: false
labels: []
---

## Description

`lifespan` in `backend/app/main.py:41-42` calls `ensure_schema(settings.database_url)` whenever `DATABASE_URL` is set. `ensure_schema` (`backend/app/core/db.py:66-68`) opens `psycopg.connect(target)` with no `connect_timeout` and no error handling. If the database is down or unreachable when the backend boots, the exception propagates out of the lifespan and the whole app fails to start; with a black-holed host the connect also waits for the OS TCP timeout.

This contradicts the intent stated in the lifespan docstring ("startup never hard-requires" a database) and in `health_service.get_health`, which is built so an unreachable database answers 503 `degraded` instead of the process dying. Today `GET /api/health` and `GET /api/version` are unreachable exactly when the database is down at boot. Docker Compose masks it (`depends_on: service_healthy` plus `restart: unless-stopped`), so it shows only on a restart while the database is down, or outside Compose.

## Evidence

```python
# backend/app/main.py:41-42
    else:
        ensure_schema(settings.database_url)
```

```python
# backend/app/core/db.py:66-68
    if isinstance(target, str):
        with psycopg.connect(target) as connection:
            _apply_schema(connection)
```

## Acceptance criteria

- [ ] With `DATABASE_URL` set to an unreachable database, the app starts and `GET /api/health` answers 503 with `status: degraded`.
- [ ] `GET /api/version` answers 200 in that state.
- [ ] The startup failure is logged with its reason, not swallowed silently.
- [ ] Startup schema creation is bounded by a connect timeout (reuse `PROBE_CONNECT_TIMEOUT_SECONDS` or an equivalent).
- [ ] With a reachable database the `notes` table is still created on startup as before.

Direction: catch `psycopg.Error` around the `ensure_schema` call in `lifespan`, log it, and continue. Decide whether the notes endpoints should retry schema creation on first use; that is left to the fix.
