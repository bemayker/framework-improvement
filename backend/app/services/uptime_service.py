"""Process start capture and uptime arithmetic (TEST-07)."""

import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class ProcessStart:
    """When the application started: wall-clock for display, monotonic for math."""

    started_at: datetime
    monotonic_start: float


def _utc_now() -> datetime:
    return datetime.now(UTC)


def capture_process_start(
    wall_clock: Callable[[], datetime] = _utc_now,
    monotonic: Callable[[], float] = time.monotonic,
) -> ProcessStart:
    """Capture the start time once; clocks are injectable so tests need no sleeps."""
    return ProcessStart(
        started_at=wall_clock().astimezone(UTC),
        monotonic_start=monotonic(),
    )


def get_uptime_seconds(
    process_start: ProcessStart, now_monotonic: float | None = None
) -> float:
    """Seconds since start, from a monotonic clock so a clock change cannot reverse it.

    Clamped at 0.0 as a guard against a reading taken before the start value.
    """
    now = time.monotonic() if now_monotonic is None else now_monotonic
    return max(0.0, now - process_start.monotonic_start)
