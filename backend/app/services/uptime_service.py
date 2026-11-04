"""Business logic for the uptime endpoint (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import UTC, datetime

# Captured once, when this module is first imported (before the server answers
# any request), so they describe process start and are never recomputed per
# request. Each process holds its own pair: with several workers each would
# report its own start, which a lifespan-hook capture would do equally.
STARTED_AT: datetime = datetime.now(UTC)
STARTED_MONOTONIC: float = time.monotonic()


@dataclass(frozen=True)
class UptimeReport:
    """The process start instant and the seconds elapsed since it."""

    started_at: datetime
    uptime_seconds: float


def elapsed_seconds(started_monotonic: float, now_monotonic: float) -> float:
    """Seconds between two monotonic readings, never negative."""
    return max(0.0, now_monotonic - started_monotonic)


def get_uptime() -> UptimeReport:
    """Report the fixed start instant and the monotonic time elapsed since it.

    Elapsed time uses the monotonic clock because the wall clock can step
    backwards, which would make uptime shrink or go negative.
    """
    return UptimeReport(
        started_at=STARTED_AT,
        uptime_seconds=elapsed_seconds(STARTED_MONOTONIC, time.monotonic()),
    )
