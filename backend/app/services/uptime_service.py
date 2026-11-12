"""Uptime arithmetic for GET /api/uptime (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class StartupStamp:
    """The wall-clock and monotonic readings taken together at app startup."""

    started_at: datetime
    started_monotonic: float


def capture_startup() -> StartupStamp:
    """Take both readings once; called when the application instance is created."""
    return StartupStamp(
        started_at=datetime.now(timezone.utc),
        started_monotonic=time.monotonic(),
    )


def compute_uptime_seconds(
    stamp: StartupStamp, now_monotonic: float | None = None
) -> float:
    """Return seconds elapsed since startup, never negative.

    Uses the monotonic clock so a wall-clock adjustment cannot make uptime go
    backwards. `now_monotonic` lets tests drive the clock without sleeping.
    """
    if now_monotonic is None:
        now_monotonic = time.monotonic()
    return max(0.0, now_monotonic - stamp.started_monotonic)
