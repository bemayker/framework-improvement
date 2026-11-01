"""Service for the server-time endpoint (FEAT-1, BUG-01)."""

from datetime import datetime, timezone

UTC_TIMEZONE_NAME = "UTC"


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Computed on every call: caching it here would reproduce the stale-time
    defect BUG-01 fixes at the edge.
    """
    return datetime.now(timezone.utc)
