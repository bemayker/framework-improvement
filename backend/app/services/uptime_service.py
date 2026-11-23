"""Business logic for the process uptime endpoint (TEST-07).

Uptime is measured on the monotonic clock because a wall-clock difference can
go backwards on a clock adjustment; `started_at` is the wall-clock UTC instant
read in the same call, so the two describe the same moment.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic


@dataclass(frozen=True)
class StartupStamp:
    """The instant the application started, on both clocks."""

    started_at: datetime
    started_monotonic: float


def capture_startup() -> StartupStamp:
    """Read both clocks once and return the startup stamp."""
    return StartupStamp(
        started_at=datetime.now(timezone.utc),
        started_monotonic=monotonic(),
    )


def uptime_seconds(stamp: StartupStamp) -> float:
    """Return the seconds elapsed since the stamp, never negative."""
    return max(0.0, monotonic() - stamp.started_monotonic)
