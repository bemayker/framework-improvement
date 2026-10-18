"""Start-mark capture and elapsed-time computation for the uptime endpoint (TEST-07)."""

import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class StartMark:
    """The moment the application started, on both the wall and monotonic clocks."""

    started_at: datetime
    monotonic_start: float


def capture_start(
    wall_clock: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
    monotonic_clock: Callable[[], float] = time.monotonic,
) -> StartMark:
    """Read both clocks once and return the start mark.

    Raises ValueError when the wall clock yields a naive datetime, because a
    start time without an offset cannot be reported in UTC unambiguously.
    """
    started_at = wall_clock()
    if started_at.tzinfo is None or started_at.utcoffset() is None:
        raise ValueError("wall clock must return a timezone-aware datetime")
    return StartMark(
        started_at=started_at.astimezone(timezone.utc),
        monotonic_start=monotonic_clock(),
    )


def elapsed_seconds(
    mark: StartMark, monotonic_clock: Callable[[], float] = time.monotonic
) -> float:
    """Seconds since the mark, never negative."""
    return max(0.0, monotonic_clock() - mark.monotonic_start)
