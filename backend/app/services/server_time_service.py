"""Server time service for GET /api/time (FEAT-1, BUG-01)."""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def current_utc_iso() -> str:
    """Return the current UTC time as ISO 8601 with an explicit +00:00 offset.

    Evaluated on every call, never at import time, so successive requests differ.
    """
    return datetime.now(timezone.utc).isoformat()
