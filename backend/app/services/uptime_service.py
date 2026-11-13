"""Business logic for reporting how long the application has been running (TEST-07).

Two clocks, each used for what it is good at: the wall clock records when the
app started (reported to humans), the monotonic clock measures elapsed time, so
a wall-clock adjustment can never make uptime negative or jump backwards.
"""

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from time import monotonic

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StartupRecord:
    """When the application instance started, on both clocks."""

    started_at: datetime
    started_monotonic: float


def capture_startup() -> StartupRecord:
    """Record the current moment as the application's start."""
    return StartupRecord(started_at=datetime.now(UTC), started_monotonic=monotonic())


def get_uptime_seconds(record: StartupRecord) -> float:
    """Return the seconds elapsed since `record` was captured, never negative.

    The clamp only matters for a clock reading taken before the record, which a
    patched or misbehaving clock can produce; it is logged so it is not silent.
    """
    elapsed = monotonic() - record.started_monotonic
    if elapsed < 0:
        logger.warning(
            "Monotonic clock reads %.6f s before the startup record; clamping uptime to 0.",
            -elapsed,
        )
        return 0.0
    return elapsed
