"""Uptime logic for the uptime endpoint (TEST-07).

Elapsed time comes from the monotonic clock so a system clock adjustment can
never make it negative or move it backwards; the wall-clock start instant is
captured at the same moment, only for display.
"""

import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone


def _utc_now() -> datetime:
    """Return the current wall-clock instant as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class ProcessClock:
    """The instant an app instance started, on both clocks."""

    started_at: datetime
    started_monotonic: float


def start_clock(
    now: Callable[[], datetime] = _utc_now,
    monotonic: Callable[[], float] = time.monotonic,
) -> ProcessClock:
    """Read both clocks once and return the start record."""
    return ProcessClock(started_at=now(), started_monotonic=monotonic())


def uptime_seconds(
    clock: ProcessClock, monotonic: Callable[[], float] = time.monotonic
) -> float:
    """Return seconds elapsed since the clock started, never below zero."""
    return max(0.0, monotonic() - clock.started_monotonic)
