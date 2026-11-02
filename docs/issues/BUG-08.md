---
id: BUG-08
type: bug
title: Notes requests open a database connection with no connect timeout
status: todo
severity: low
depends_on: []
scaffold: false
---

## Description

`get_connection` (`backend/app/core/db.py:93`) calls `psycopg.connect(settings.database_url)` with no `connect_timeout`, and `ensure_schema` (`backend/app/core/db.py:67`) does the same at startup. `probe_connection` bounds its own connect to 2 seconds for exactly this reason (`db.py:28-31`: libpq otherwise waits for the OS TCP timeout). When the database host is unreachable, `POST` and `GET /api/notes` therefore hang for the OS timeout, holding a worker thread each, while `/api/health` answers 503 within 2 seconds. Under repeated requests this can exhaust the threadpool.

## Evidence

```python
# backend/app/core/db.py
connection = psycopg.connect(settings.database_url)
```

## Acceptance criteria

- [ ] When the database is unreachable, `GET /api/notes` and `POST /api/notes` fail within a bounded time instead of waiting for the OS TCP timeout.
- [ ] The bound is a single named constant shared with the probe, not a second literal.
- [ ] Behaviour with a reachable database is unchanged.

## Fix direction

Pass `connect_timeout` to the request and startup connections, reusing the probe's constant (renamed if it no longer reads as probe-only).
