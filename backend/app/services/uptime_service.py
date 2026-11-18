"""Process start marker and uptime calculation (TEST-07)."""

import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    """The moment the app was built: wall-clock for display, monotonic for maths."""

    started_at: datetime
    monotonic_start: float


def _utc_now() -> datetime:
    """Return the current wall-clock time as an aware UTC datetime."""
    return datetime.now(timezone.utc)


def capture_process_start(
    wall_clock: Callable[[], datetime] = _utc_now,
    monotonic_clock: Callable[[], float] = time.monotonic,
) -> ProcessStart:
    """Read each clock once and return the start marker."""
    return ProcessStart(started_at=wall_clock(), monotonic_start=monotonic_clock())


def uptime_seconds(
    process_start: ProcessStart,
    monotonic_clock: Callable[[], float] = time.monotonic,
) -> float:
    """Return elapsed seconds since start, never negative.

    The monotonic clock cannot step backwards on a wall-clock adjustment; the
    clamp is the explicit guarantee behind "non-negative".
    """
    return max(0.0, monotonic_clock() - process_start.monotonic_start)
