"""Server time service (BUG-01, recreating FEAT-1's `GET /api/time` endpoint)."""

from datetime import UTC, datetime


def _utc_now() -> datetime:
    """Read the clock in one place so tests can control it without sleeping."""
    return datetime.now(UTC)


def get_server_time() -> datetime:
    """Return the current timezone-aware UTC instant, computed on every call."""
    return _utc_now()
