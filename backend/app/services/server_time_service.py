"""Business logic for reporting the server's current time (FEAT-1)."""

from datetime import UTC, datetime


def _utc_now() -> datetime:
    """Clock seam: tests replace this module attribute to control the time."""
    return datetime.now(UTC)


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime, per call."""
    return _utc_now()
