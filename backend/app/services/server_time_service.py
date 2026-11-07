"""Server time service (BUG-01)."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime, computed per call."""
    return datetime.now(timezone.utc)
