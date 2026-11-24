"""Server clock for GET /api/time (FEAT-1, restored with BUG-01).

Its own layer so tests can substitute the clock without patching `datetime`.
"""

from datetime import UTC, datetime


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime, per call."""
    return datetime.now(UTC)
