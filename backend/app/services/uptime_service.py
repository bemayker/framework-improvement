"""Business logic for the uptime endpoint (TEST-07).

The process start is captured **once, at module import**, which is process
startup: `app.main` imports the uptime router, which imports this module,
before the server answers its first request. Nothing in the request path
reassigns either constant, so `started_at` is a property of the process rather
than of the request (criterion 3).

Elapsed time is measured on the monotonic clock rather than by subtracting two
wall-clock readings: an NTP correction or a manual clock change can make a
wall-clock difference negative or non-increasing, and criterion 2 requires the
reported value to be both non-negative and increasing.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic

# Captured back to back at import. The wall clock is the value an operator
# reads; the monotonic reading is the reference elapsed time is measured from.
# `monotonic` is imported by name so a unit test can monkeypatch it on this
# module (the pattern `version_service` uses for `version`).
STARTED_AT: datetime = datetime.now(timezone.utc)
_STARTED_MONOTONIC: float = monotonic()


@dataclass(frozen=True)
class UptimeReport:
    """The outcome of one uptime read: elapsed seconds and the process start."""

    uptime_seconds: float
    started_at: datetime


def get_uptime() -> UptimeReport:
    """Return the seconds elapsed since process start, and that start.

    Not clamped to zero: the monotonic clock cannot run backwards, so a
    negative value would be a real defect, and clamping would hide it rather
    than report it. The schema's `ge=0` bound is the contract's guard.
    """
    return UptimeReport(
        uptime_seconds=monotonic() - _STARTED_MONOTONIC,
        started_at=STARTED_AT,
    )
