"""Process start capture and uptime computation (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class ProcessStart:
    started_at: datetime
    started_monotonic: float


def capture_process_start() -> ProcessStart:
    """Read the wall clock and the monotonic clock once; call only at startup."""
    return ProcessStart(
        started_at=datetime.now(UTC),
        started_monotonic=time.monotonic(),
    )


def compute_uptime_seconds(
    process_start: ProcessStart, now_monotonic: float | None = None
) -> float:
    """Seconds elapsed since start, from the monotonic clock, never negative."""
    now = time.monotonic() if now_monotonic is None else now_monotonic
    return max(0.0, now - process_start.started_monotonic)
