"""Server-time service (FEAT-1, recreated by BUG-01).

The clock is read on every call, never cached at import time, so each request
gets a fresh value.
"""

from datetime import datetime, timezone

UTC_TIMEZONE_NAME = "UTC"


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
