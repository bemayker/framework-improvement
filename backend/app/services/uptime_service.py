"""Process start capture and uptime arithmetic (TEST-07)."""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    started_at: datetime
    started_monotonic: float


def capture_process_start() -> ProcessStart:
    """Record the wall-clock start (UTC) and a monotonic reference, once each."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc),
        started_monotonic=time.monotonic(),
    )


def get_uptime_seconds(start: ProcessStart, now_monotonic: float | None = None) -> float:
    """Seconds since `start`, from the monotonic clock so wall-clock steps cannot shrink it."""
    now = time.monotonic() if now_monotonic is None else now_monotonic
    return max(0.0, now - start.started_monotonic)
