"""Business logic for reporting how long the process has been running (TEST-07).

The duration is measured with the monotonic clock so it can never shrink or go
negative when the wall clock is adjusted; the wall clock is used only for the
reported `started_at` timestamp, where a calendar time is what the caller needs.
"""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    """The moment the application started, as a wall-clock and a monotonic reading."""

    started_at: datetime
    monotonic_start: float


def capture_process_start() -> ProcessStart:
    """Record the start instant once; both readings are taken together."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc),
        monotonic_start=time.monotonic(),
    )


def seconds_since(start: ProcessStart) -> float:
    """Return the seconds elapsed since `start`, from the monotonic clock."""
    return time.monotonic() - start.monotonic_start
