---
id: BUG-09
type: bug
title: Per-request database connect has no timeout, so notes requests can hang
severity: low
status: todo
branch: feature/BUG-09-request-connect-timeout
depends_on: []
scaffold: false
---

## Description

`get_connection` (`backend/app/core/db.py:93`) calls `psycopg.connect(settings.database_url)` with no `connect_timeout`. If the database host is blackholed, each `/api/notes` request blocks a worker-thread until the OS TCP timeout, while the health probe in the same module bounds its connect at 2 seconds for this reason (`db.py:28-31`, `PROBE_CONNECT_TIMEOUT_SECONDS`). Repeated requests can exhaust the threadpool that serves the sync endpoints, including `/api/health` and `/api/version`. This is the per-request counterpart of BUG-07 (startup).

## Evidence

```python
connection = psycopg.connect(settings.database_url)
```

## Acceptance criteria

- [ ] The per-request connect uses a bounded `connect_timeout`, defined as a named constant.
- [ ] An unreachable database makes the notes endpoints fail within that bound.

Fix direction: share one connect-timeout constant between the probe, startup and request paths.
