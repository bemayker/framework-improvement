"""Service for the server time endpoint."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime.

    Computed on every call: a value cached at module level would make the
    endpoint report a frozen time.
    """
    return datetime.now(timezone.utc)
