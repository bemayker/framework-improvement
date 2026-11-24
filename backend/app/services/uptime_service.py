"""Business logic for the uptime endpoint (TEST-07).

The wall-clock start is kept for display and a monotonic reading for elapsed
time, so a wall-clock adjustment can never make the reported uptime negative.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic


@dataclass(frozen=True)
class ProcessStart:
    """When the process started: wall clock for display, monotonic for elapsed time."""

    started_at: datetime
    started_monotonic: float


def capture_process_start() -> ProcessStart:
    """Read both clocks once, at application startup."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc), started_monotonic=monotonic()
    )


def uptime_seconds(start: ProcessStart) -> float:
    """Return seconds elapsed since the start, never below zero."""
    return max(0.0, monotonic() - start.started_monotonic)
