"""Business logic for the server time endpoint (BUG-01)."""

from datetime import UTC, datetime


def get_current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime.

    Evaluated on every call, never cached: a stored value would reintroduce
    the stale-time defect inside the app itself.
    """
    return datetime.now(UTC)
