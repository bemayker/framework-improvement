"""Server time service (BUG-01, recreating the FEAT-1 endpoint's logic)."""

from datetime import UTC, datetime


def get_current_utc_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Evaluated on every call, never at import time: a value cached at module
    level would make every response report the process start time.
    """
    return datetime.now(UTC)
