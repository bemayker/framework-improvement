"""Server-time service (BUG-01)."""

from datetime import datetime, timezone


def current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Computed on every call: caching it would serve a stale value, which is the
    defect this endpoint's no-store header exists to prevent at the edge.
    """
    return datetime.now(timezone.utc)
