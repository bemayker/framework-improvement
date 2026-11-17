"""Process start capture and uptime arithmetic for GET /api/uptime (TEST-07).

The start is read once as a pair: the wall-clock instant is what the API
reports, the monotonic reading is what uptime is measured against, so a
wall-clock adjustment can never make uptime negative or shrink it.
"""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    """The instant the application started, on both clocks."""

    started_at: datetime
    monotonic: float


def capture_process_start() -> ProcessStart:
    """Read both clocks once, at application startup."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc), monotonic=time.monotonic()
    )


def uptime_seconds(start: ProcessStart, now_monotonic: float) -> float:
    """Seconds elapsed since `start`, never below zero."""
    return max(0.0, now_monotonic - start.monotonic)
