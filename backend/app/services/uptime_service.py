"""Uptime logic for GET /api/uptime (TEST-07).

Elapsed time comes from the monotonic clock, so it never goes negative or
jumps when the wall clock is stepped. The wall-clock start is captured once.
"""

import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class StartMark:
    """The application's start, as a UTC wall-clock instant and a monotonic reading."""

    started_at: datetime
    monotonic_start: float


@dataclass(frozen=True)
class UptimeReport:
    """How long the application has been running, and since when."""

    uptime_seconds: float
    started_at: datetime


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def capture_start(
    wall_clock: Callable[[], datetime] = _utc_now,
    monotonic_clock: Callable[[], float] = time.monotonic,
) -> StartMark:
    """Record the start instant; the clocks are injectable for tests."""
    return StartMark(started_at=wall_clock(), monotonic_start=monotonic_clock())


def get_uptime(
    mark: StartMark,
    monotonic_clock: Callable[[], float] = time.monotonic,
) -> UptimeReport:
    """Report elapsed seconds since `mark`, with its start time unchanged."""
    return UptimeReport(
        uptime_seconds=monotonic_clock() - mark.monotonic_start,
        started_at=mark.started_at,
    )
