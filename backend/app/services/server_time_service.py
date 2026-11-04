"""Service for the server-time endpoint (BUG-01, recreating FEAT-1)."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Computed on every call, never cached at import time, so two calls a second
    apart always differ.
    """
    return datetime.now(timezone.utc)
