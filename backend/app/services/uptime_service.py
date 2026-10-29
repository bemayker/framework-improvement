"""Process uptime calculation (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    """When the application started: wall clock for display, monotonic for duration."""

    started_at: datetime
    started_monotonic: float


def capture_process_start() -> ProcessStart:
    """Read both clocks once; called exactly once, from the app lifespan."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc),
        started_monotonic=time.monotonic(),
    )


def get_uptime_seconds(process_start: ProcessStart) -> float:
    """Seconds since startup, never negative whatever the clock reads."""
    return max(0.0, time.monotonic() - process_start.started_monotonic)
