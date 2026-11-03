---
id: BUG-10
type: bug
title: A blank DATABASE_URL is treated as configured instead of unset
severity: low
status: todo
branch: feature/BUG-10-blank-database-url
depends_on: []
scaffold: false
---

## Description

`Settings.database_url` (`backend/app/core/config.py:38-40`) returns `os.environ.get("DATABASE_URL")`, so an empty or whitespace-only value is not `None`. The other settings treat blank as unset (`_read_cors_origins`, `_read_build_commit`, config.py:22-30). With `DATABASE_URL=""` (a common result of `${DATABASE_URL:-}` style compose wiring):

- the lifespan skips its "not set" warning and calls `ensure_schema("")` (`main.py:42`), which connects using libpq defaults and raises, so the app fails to start, and
- `get_health` (`health_service.py:44`) and `get_connection` (`db.py:87`) try to connect instead of reporting "not configured".

## Evidence

```python
database_url: str | None = field(
    default_factory=lambda: os.environ.get("DATABASE_URL")
)
```

## Acceptance criteria

- [ ] An unset, empty or whitespace-only `DATABASE_URL` yields `database_url is None`.
- [ ] Surrounding whitespace on a real value is stripped.

Fix direction: read it the way `_read_build_commit` does, stripping and mapping blank to `None`.
