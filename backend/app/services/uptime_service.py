"""Uptime measurement for GET /api/uptime (TEST-07)."""

import logging
import time
from dataclasses import dataclass
from datetime import UTC, datetime

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StartMark:
    """When an app instance started: wall-clock for display, monotonic for math."""

    started_at: datetime
    started_monotonic: float


def capture_start_mark() -> StartMark:
    """Read both clocks once; called only at application startup."""
    return StartMark(started_at=datetime.now(UTC), started_monotonic=time.monotonic())


def uptime_seconds(mark: StartMark, now_monotonic: float | None = None) -> float:
    """Seconds elapsed since the mark, measured on the monotonic clock.

    The monotonic clock is immune to wall-clock adjustments; the clamp only
    guards an injected or mismatched reading.
    """
    if now_monotonic is None:
        now_monotonic = time.monotonic()
    elapsed = now_monotonic - mark.started_monotonic
    if elapsed < 0:
        logger.warning(
            "Uptime clamped to 0: now_monotonic=%s precedes started_monotonic=%s",
            now_monotonic,
            mark.started_monotonic,
        )
        return 0.0
    return elapsed
