"""Server time logic: always UTC, always with an explicit offset."""

from datetime import UTC, datetime


def to_utc_iso(moment: datetime) -> str:
    """Format an aware datetime as ISO 8601 in UTC (offset is always +00:00).

    A naive datetime is rejected rather than guessed at: assuming a zone here
    would silently produce a wrong instant.
    """
    if moment.tzinfo is None or moment.utcoffset() is None:
        raise ValueError("moment must be timezone-aware")
    return moment.astimezone(UTC).isoformat()


def get_server_time() -> str:
    """Return the current server time, evaluated on every call (never cached)."""
    return to_utc_iso(datetime.now(UTC))
