"""Business logic for reporting the server's current time (FEAT-1)."""

from datetime import UTC, datetime
from typing import Final

UTC_TIMEZONE_NAME: Final = "UTC"


def get_current_utc_time() -> datetime:
    """Return the current instant as a timezone-aware UTC datetime.

    Read from the clock on every call, never cached, so each request gets a
    fresh value.
    """
    return datetime.now(UTC)
