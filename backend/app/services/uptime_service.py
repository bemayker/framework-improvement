"""Uptime logic for GET /api/uptime (TEST-07)."""

from dataclasses import dataclass
from datetime import UTC, datetime
from time import monotonic


@dataclass(frozen=True)
class StartupMark:
    """The application's startup instant, as wall-clock and monotonic readings."""

    started_at: datetime
    started_monotonic: float


def capture_startup() -> StartupMark:
    """Record the startup instant: wall-clock UTC for display, monotonic for math."""
    return StartupMark(started_at=datetime.now(UTC), started_monotonic=monotonic())


def uptime_seconds(mark: StartupMark) -> float:
    """Seconds elapsed since `mark`, measured on the monotonic clock.

    Monotonic time cannot go backwards, so a wall-clock adjustment never makes
    this negative. It is deliberately not clamped: the response schema's
    `ge=0` turns an impossible negative into a loud error.
    """
    return monotonic() - mark.started_monotonic
