"""Server time service (FEAT-1, BUG-01)."""

from datetime import datetime, timezone


def get_server_now() -> str:
    """Return the current UTC time as an ISO 8601 string with a +00:00 offset.

    The clock is read on every call, never at import time, so each request
    gets a fresh value.
    """
    return datetime.now(timezone.utc).isoformat()
