"""Process start capture and uptime computation (TEST-07).

The wall-clock start is kept for display; elapsed time is measured on the
monotonic clock so a wall-clock adjustment can never make uptime negative or
move it backwards.
"""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    """When the process started: wall-clock (UTC) and a monotonic origin."""

    started_at: datetime
    monotonic_origin: float


def capture_process_start() -> ProcessStart:
    """Record the process start; call once per application instance."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc),
        monotonic_origin=time.monotonic(),
    )


def get_uptime_seconds(
    process_start: ProcessStart, now_monotonic: float | None = None
) -> float:
    """Return seconds elapsed since the process start, never below 0.0.

    `now_monotonic` exists so tests can inject a clock; callers in the app
    leave it unset and the current monotonic time is read at call time.
    """
    if now_monotonic is None:
        now_monotonic = time.monotonic()
    return max(0.0, now_monotonic - process_start.monotonic_origin)
