"""Service for the server-time endpoint (BUG-01)."""

from datetime import UTC, datetime


def get_current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime, computed per call."""
    return datetime.now(UTC)
