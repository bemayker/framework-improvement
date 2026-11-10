"""Process start capture and uptime computation (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    """When the application started: wall clock for display, monotonic for elapsed time."""

    started_at: datetime
    monotonic_start: float


def capture_process_start() -> ProcessStart:
    """Read both clocks once; called a single time per application instance."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc),
        monotonic_start=time.monotonic(),
    )


def uptime_seconds(start: ProcessStart, now_monotonic: float | None = None) -> float:
    """Seconds since `start`, from the monotonic clock so it never goes backwards.

    `now_monotonic` lets tests inject a clock reading instead of patching.
    """
    if now_monotonic is None:
        now_monotonic = time.monotonic()
    return max(0.0, now_monotonic - start.monotonic_start)
