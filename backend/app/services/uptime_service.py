"""Process uptime logic for GET /api/uptime (TEST-07)."""

import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class ProcessStart:
    """The instant the application started, on both clocks.

    The wall-clock value is what is reported; the monotonic reading is what
    uptime is measured against, so an adjusted system clock can never make
    uptime go backwards.
    """

    started_at: datetime
    started_monotonic: float


def _utc_now() -> datetime:
    return datetime.now(UTC)


def capture_process_start(
    wall_clock: Callable[[], datetime] = _utc_now,
    monotonic_clock: Callable[[], float] = time.monotonic,
) -> ProcessStart:
    """Capture both clocks once; the wall-clock value is normalised to UTC."""
    started_at = wall_clock()
    if started_at.tzinfo is None:
        raise ValueError("wall clock must return an aware datetime")
    return ProcessStart(
        started_at=started_at.astimezone(UTC),
        started_monotonic=monotonic_clock(),
    )


def compute_uptime_seconds(
    start: ProcessStart, now_monotonic: float | None = None
) -> float:
    """Seconds elapsed since the start; never negative."""
    now = time.monotonic() if now_monotonic is None else now_monotonic
    return max(0.0, now - start.started_monotonic)
