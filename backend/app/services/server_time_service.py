"""Service returning the server's current time (BUG-01)."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Computed on every call, never cached at module level.
    """
    return datetime.now(timezone.utc)
