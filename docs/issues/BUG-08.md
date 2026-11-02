---
id: BUG-08
type: bug
title: Notes connections have no connect timeout, so an unreachable database can stall the worker pool and the health probe
severity: low
status: todo
depends_on: []
---

## Description

`get_connection` opens `psycopg.connect(settings.database_url)` with no `connect_timeout` (`backend/app/core/db.py:93`). The health probe deliberately bounds its connect to 2 seconds (`PROBE_CONNECT_TIMEOUT_SECONDS`, `db.py:31`, with the comment that an unbounded connect "is not a probe"). The notes endpoints are sync `def` routes, so each waiting request occupies a thread from the shared threadpool (default 40). When the database host is unreachable (black-holed packets rather than a refusal), each notes request waits for the OS TCP timeout, and enough of them exhaust the pool. `GET /api/health` is also a sync route on the same pool, so it queues behind them and stops answering 503 promptly, which is the failure TEST-02's bound was meant to prevent.

`ensure_schema` at startup (`db.py:67`) has the same unbounded connect, but it runs once and is covered by `restart: unless-stopped`.

## Evidence

```python
# backend/app/core/db.py:31  bounded
PROBE_CONNECT_TIMEOUT_SECONDS = 2
# backend/app/core/db.py:93  not bounded
connection = psycopg.connect(settings.database_url)
```

Inferred from the code and psycopg/libpq semantics; not reproduced against a black-holed host.

## Acceptance criteria

- [ ] The per-request connection in `get_connection` uses a bounded connect timeout.
- [ ] With an unreachable database, a notes request fails within that bound, and `GET /api/health` still answers 503 promptly while notes requests are failing.
- [ ] The timeout is a named constant (reuse or generalise the probe constant), not a repeated literal.

## Fix direction

Pass `connect_timeout` in `get_connection`, sharing one constant with the probe.
