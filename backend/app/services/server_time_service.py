"""Service for the server time endpoint (BUG-01)."""

from datetime import UTC, datetime


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Read on every call, never at import time, so each request sees a fresh value.
    """
    return datetime.now(UTC)
