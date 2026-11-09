"""Process start capture and uptime computation (TEST-07)."""

from dataclasses import dataclass
from datetime import UTC, datetime
from time import monotonic


@dataclass(frozen=True)
class ProcessStart:
    """Wall-clock start (for display) and monotonic start (for elapsed time)."""

    started_at: datetime
    monotonic_start: float


def capture_process_start() -> ProcessStart:
    """Record the start instant once; callers keep the result."""
    return ProcessStart(started_at=datetime.now(UTC), monotonic_start=monotonic())


def get_uptime_seconds(start: ProcessStart) -> float:
    """Return elapsed seconds since `start`, never negative.

    Uses the monotonic clock so a wall-clock adjustment cannot make the value
    go backwards; the clamp is a guard for a clock reading below the start.
    """
    return max(0.0, monotonic() - start.monotonic_start)
