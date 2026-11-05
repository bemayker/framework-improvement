"""Process start capture and elapsed-time logic for GET /api/uptime (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class ProcessStart:
    started_at: datetime
    monotonic_start: float


def capture_process_start() -> ProcessStart:
    """Read both clocks once: wall clock for display, monotonic for elapsed time."""
    return ProcessStart(
        started_at=datetime.now(UTC),
        monotonic_start=time.monotonic(),
    )


def elapsed_seconds(process_start: ProcessStart) -> float:
    """Seconds since the process started.

    Uses the monotonic clock so a wall-clock adjustment can never make the
    uptime shrink or go negative.
    """
    return time.monotonic() - process_start.monotonic_start
