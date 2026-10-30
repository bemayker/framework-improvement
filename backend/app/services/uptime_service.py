"""Process clock for the uptime endpoint (TEST-07)."""

from dataclasses import dataclass
from datetime import UTC, datetime
from time import monotonic


@dataclass(frozen=True)
class ProcessClock:
    """Two readings taken at the same moment, when the process started.

    `started_at` is what the API reports; `started_monotonic` is what elapsed
    time is measured from, so a stepped wall clock can never make uptime go
    negative or backwards.
    """

    started_at: datetime
    started_monotonic: float


def start_clock() -> ProcessClock:
    """Capture the wall-clock and monotonic start readings together."""
    return ProcessClock(started_at=datetime.now(UTC), started_monotonic=monotonic())


def uptime_seconds(clock: ProcessClock) -> float:
    """Return seconds elapsed since the clock was started."""
    return monotonic() - clock.started_monotonic
