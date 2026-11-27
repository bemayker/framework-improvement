"""Business logic for reporting the server's current time (FEAT-1, BUG-01).

The time is computed on every call and never memoised: the endpoint's whole
point is a fresh value, and BUG-01 was a cache serving an old one.
"""

from datetime import datetime, timezone

from app.schemas.server_time import ServerTimeResponse

TIMEZONE_NAME = "UTC"


def _utc_now() -> datetime:
    """Return the current aware UTC time; a seam so tests can substitute the clock."""
    return datetime.now(timezone.utc)


def get_server_time() -> ServerTimeResponse:
    """Return the current UTC time as ISO 8601 with an explicit +00:00 offset."""
    return ServerTimeResponse(now=_utc_now().isoformat(), timezone=TIMEZONE_NAME)
