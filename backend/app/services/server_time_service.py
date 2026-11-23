"""Business logic for the server time endpoint (FEAT-1, recreated by BUG-01).

The time is computed on every call and never held in a module-level value:
a memoised value would be stale by construction, which is the defect BUG-01
fixes at the HTTP layer.
"""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
