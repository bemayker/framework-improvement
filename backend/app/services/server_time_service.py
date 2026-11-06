"""Service for the server time endpoint (FEAT-1, BUG-01)."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current instant as a timezone-aware UTC datetime.

    Computed on every call; never cached, so each request sees a fresh value.
    """
    return datetime.now(timezone.utc)
