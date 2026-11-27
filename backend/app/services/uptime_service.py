"""Service logic for the uptime endpoint (TEST-07).

Holds the clock arithmetic apart from the router so it is testable with a
patched monotonic clock and needs no HTTP or database.
"""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class StartupClock:
    """The instant the application started, on the wall clock and the monotonic one."""

    started_at: datetime
    started_monotonic: float


def capture_startup() -> StartupClock:
    """Capture the startup instant; called once per application instance."""
    return StartupClock(
        started_at=datetime.now(timezone.utc),
        started_monotonic=time.monotonic(),
    )


def compute_uptime(clock: StartupClock) -> float:
    """Return seconds elapsed since startup, measured on the monotonic clock.

    Monotonic so a wall-clock adjustment can never make the value negative.
    """
    return time.monotonic() - clock.started_monotonic
