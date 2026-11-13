"""Process uptime for GET /api/uptime (TEST-07).

The start is captured once, when this module is first imported, which happens
when `app.main` imports the uptime router at process start. That fixes one
value per process, so it is never recomputed per request.
"""

import time
from datetime import datetime, timezone

STARTED_AT: datetime = datetime.now(timezone.utc)
# Elapsed time uses the monotonic clock so a wall-clock adjustment can never
# make the uptime jump backwards.
_STARTED_MONOTONIC: float = time.monotonic()


def get_started_at() -> datetime:
    """Return the instant this process started (UTC, timezone-aware)."""
    return STARTED_AT


def get_uptime_seconds() -> float:
    """Return seconds elapsed since the process started, never negative."""
    return max(0.0, time.monotonic() - _STARTED_MONOTONIC)
