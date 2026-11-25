"""Uptime service (TEST-07).

`STARTED_AT` and `STARTED_MONOTONIC` are module-level so they are captured
once, when the module is first imported at process start, and never
recomputed per request. Elapsed time uses the monotonic clock so a wall-clock
step (NTP) can never make `uptime_seconds` decrease.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic

STARTED_AT: datetime = datetime.now(timezone.utc)
STARTED_MONOTONIC: float = monotonic()


@dataclass(frozen=True)
class UptimeReport:
    """Process uptime and the instant the process started."""

    uptime_seconds: float
    started_at: datetime


def get_uptime() -> UptimeReport:
    """Return seconds since startup and the fixed startup timestamp."""
    return UptimeReport(
        uptime_seconds=monotonic() - STARTED_MONOTONIC,
        started_at=STARTED_AT,
    )
