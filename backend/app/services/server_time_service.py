"""Service returning the current server time."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Computed on every call: caching it at module level would serve a stale
    value, which is the defect this endpoint's header guards against.
    """
    return datetime.now(timezone.utc)
