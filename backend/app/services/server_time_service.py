"""Server-time logic for GET /api/time (BUG-01)."""

from datetime import UTC, datetime


def to_utc_iso(moment: datetime) -> str:
    """Format an aware datetime as ISO 8601 in UTC with an explicit +00:00 offset."""
    if moment.tzinfo is None or moment.utcoffset() is None:
        raise ValueError("moment must be timezone-aware")
    return moment.astimezone(UTC).isoformat()


def get_server_time() -> str:
    """Return the current UTC time, evaluated on every call (never cached)."""
    return to_utc_iso(datetime.now(UTC))
