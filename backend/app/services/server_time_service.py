"""Server time service (BUG-01): the current UTC time, computed per call."""

from datetime import datetime, timezone


def get_server_time() -> datetime:
    """Return the current time as an aware UTC datetime, never a cached value."""
    return datetime.now(timezone.utc)
