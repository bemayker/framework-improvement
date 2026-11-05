"""Server time service (FEAT-1, recreated by BUG-01)."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Evaluated on every call, never at import time, so each request sees a
    fresh value.
    """
    return datetime.now(timezone.utc)
