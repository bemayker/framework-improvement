"""Process uptime for GET /api/uptime (TEST-07).

The start is captured once per application instance (in `create_app()`), and
uptime is measured on the monotonic clock so a wall-clock step cannot make it
go backwards.
"""

import time
from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class ProcessStart:
    """When the application instance started, on both clocks."""

    started_at: datetime
    monotonic_start: float


def _utc_now() -> datetime:
    """Wall-clock UTC now; a seam so unit tests can pin the clock."""
    return datetime.now(UTC)


def capture_process_start() -> ProcessStart:
    """Read both clocks once; called only from the app factory."""
    return ProcessStart(started_at=_utc_now(), monotonic_start=time.monotonic())


def get_uptime_seconds(process_start: ProcessStart) -> float:
    """Seconds since `process_start`, never negative.

    The clamp only guards a hand-built record; with the real monotonic clock
    the difference is never negative.
    """
    return max(0.0, time.monotonic() - process_start.monotonic_start)
