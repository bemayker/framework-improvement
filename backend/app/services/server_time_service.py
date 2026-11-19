"""Server-time service (FEAT-1, recreated by BUG-01)."""

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current time as an aware UTC datetime (the one clock seam)."""
    return datetime.now(timezone.utc)


def get_server_time() -> datetime:
    """Return the server's current UTC time, computed on every call."""
    return utc_now()
