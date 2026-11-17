"""Server time service (FEAT-1, BUG-01).

The time is read on every call, never at import, so each request gets a fresh
value instead of the one captured at process start.
"""

from datetime import datetime, timezone

UTC_TIMEZONE_NAME = "UTC"


def get_current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime."""
    return datetime.now(timezone.utc)
