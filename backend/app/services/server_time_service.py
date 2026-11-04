"""Service returning the current server time (FEAT-1, BUG-01)."""

from datetime import datetime, timezone


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Computed on every call, never cached or captured at import time.
    """
    return datetime.now(timezone.utc)
