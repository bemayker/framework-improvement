"""Server-time service (BUG-01).

The time is computed per call and always timezone-aware: a cached or naive
value would defeat the endpoint's purpose of reporting the server's UTC now.
"""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
