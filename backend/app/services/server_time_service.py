"""Time source for GET /api/time (BUG-01)."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current instant as a timezone-aware UTC datetime.

    Computed on every call so the value is never cached in process.
    """
    return datetime.now(timezone.utc)
