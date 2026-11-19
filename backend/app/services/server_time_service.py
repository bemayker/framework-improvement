"""Server time service (FEAT-1, restored by BUG-01)."""

from datetime import datetime, timezone


def get_server_time() -> datetime:
    """Return the current time as an aware UTC datetime, computed per call."""
    return datetime.now(timezone.utc)
