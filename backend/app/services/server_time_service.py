"""Business logic for the server time endpoint (BUG-01, recreating FEAT-1)."""

from datetime import datetime, timezone


def get_server_now() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Computed on every call, never cached, so each request sees a fresh value.
    """
    return datetime.now(timezone.utc)
