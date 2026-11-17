"""Server clock for GET /api/time (FEAT-1, BUG-01).

The time is read on every call and never cached at import, so each request
reports a fresh value.
"""

from datetime import datetime, timezone

UTC_TIMEZONE_NAME = "UTC"


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
