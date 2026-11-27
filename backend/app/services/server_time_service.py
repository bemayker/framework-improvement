"""Business logic for the server time endpoint (FEAT-1, BUG-01).

The clock is read on every call, never at import time, so each request gets
a fresh value.
"""

from datetime import datetime, timezone


def get_server_time() -> datetime:
    """Return the current time as a UTC-aware datetime."""
    return datetime.now(timezone.utc)
