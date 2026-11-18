"""Business logic for the server's current time (BUG-01, recreating FEAT-1).

The time is computed on every call and never cached here: a stale value is
exactly the defect BUG-01 fixes at the HTTP layer, so the service must stay
fresh by construction.
"""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Aware (not the naive `datetime.utcnow()`), so `isoformat()` always carries
    an explicit `+00:00` offset.
    """
    return datetime.now(timezone.utc)
