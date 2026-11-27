"""Server clock service for GET /api/time (BUG-01).

Reads the clock on every call: the service itself never caches the instant,
so any staleness seen in production comes from a layer in front of the app.
"""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def _utc_now() -> datetime:
    """Return the current instant as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def get_server_time() -> datetime:
    """Return the server's current UTC time, freshly read on every call."""
    return _utc_now()
