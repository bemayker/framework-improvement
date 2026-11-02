"""Process start capture and uptime calculation (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class ProcessStart:
    """When the application started, as wall-clock time and as a monotonic reading.

    The wall-clock value is what an operator reads; the monotonic reading is what
    uptime is computed from, so a wall-clock adjustment can never make it negative.
    """

    started_at: datetime
    started_monotonic: float


def capture_process_start() -> ProcessStart:
    """Capture the start instant. Called once, from the application lifespan."""
    return ProcessStart(started_at=datetime.now(UTC), started_monotonic=time.monotonic())


def get_uptime_seconds(process_start: ProcessStart, now_monotonic: float | None = None) -> float:
    """Return seconds elapsed since `process_start`, never below zero.

    `now_monotonic` is a seam for tests; it defaults to the current monotonic clock.
    """
    now = time.monotonic() if now_monotonic is None else now_monotonic
    return max(0.0, now - process_start.started_monotonic)
