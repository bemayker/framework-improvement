"""Business logic for the uptime endpoint (TEST-07).

The process start is captured once, when this module is first imported (which
`app.main` does at process start through the router import), so `started_at`
is stable for the whole process. Uptime is measured on the monotonic clock so a
system clock adjustment can never make it negative or decrease.
"""

import time
from dataclasses import dataclass
from datetime import datetime, timezone

PROCESS_STARTED_AT = datetime.now(timezone.utc)
PROCESS_STARTED_MONOTONIC = time.monotonic()

# Millisecond resolution is all an operator reading an uptime needs.
UPTIME_DECIMAL_PLACES = 3


@dataclass(frozen=True)
class UptimeReport:
    """How long the process has been running and when it started."""

    uptime_seconds: float
    started_at: datetime


def get_uptime() -> UptimeReport:
    """Report the process uptime and its fixed start time.

    The start time is never recomputed. The clamp at zero keeps the
    non-negative contract explicit; a monotonic clock cannot trigger it.
    """
    elapsed = time.monotonic() - PROCESS_STARTED_MONOTONIC
    return UptimeReport(
        uptime_seconds=round(max(0.0, elapsed), UPTIME_DECIMAL_PLACES),
        started_at=PROCESS_STARTED_AT,
    )
