"""Service for the server-time endpoint (BUG-01, recreating FEAT-1's contract)."""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def _utc_now() -> datetime:
    """Read the clock; a seam so tests can substitute instants without sleeping."""
    return datetime.now(timezone.utc)


def get_server_time() -> datetime:
    """Return the current timezone-aware UTC time, computed on every call."""
    return _utc_now()
