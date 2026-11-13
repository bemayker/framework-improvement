"""Server time formatting for GET /api/time (BUG-01, recreating FEAT-1's endpoint)."""

from datetime import UTC, datetime


def to_utc_iso(moment: datetime) -> str:
    """Format an aware datetime as ISO 8601 UTC with an explicit +00:00 offset."""
    if moment.tzinfo is None or moment.utcoffset() is None:
        raise ValueError("moment must be timezone-aware")
    return moment.astimezone(UTC).isoformat()


def get_server_time() -> str:
    """Return the current UTC time, evaluated per call and never cached."""
    return to_utc_iso(datetime.now(UTC))
