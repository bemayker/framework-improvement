"""Business logic for reporting how long the application has been running (TEST-07).

The start mark is captured once at application startup and kept on the app
state, so every request reads the same value and each app instance owns its
own. Elapsed time uses the monotonic clock, which never goes backwards when
the wall clock is stepped.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic

from starlette.datastructures import State

logger = logging.getLogger(__name__)


class UptimeNotRecordedError(RuntimeError):
    """The app state holds no start mark, meaning the lifespan never ran."""


@dataclass(frozen=True)
class StartMark:
    """The moment the application started, on both clocks."""

    started_at: datetime
    monotonic_at: float


def capture_start() -> StartMark:
    """Read the UTC wall clock and the monotonic clock together."""
    return StartMark(started_at=datetime.now(timezone.utc), monotonic_at=monotonic())


def get_start_mark(state: State) -> StartMark:
    """Return the start mark recorded at startup, or raise when there is none."""
    start = getattr(state, "uptime_start", None)
    if start is None:
        logger.error("No uptime start mark on app state; the lifespan did not run.")
        raise UptimeNotRecordedError("Application startup recorded no uptime start mark.")
    return start


def uptime_seconds(start: StartMark) -> float:
    """Return seconds elapsed on the monotonic clock since `start`."""
    return monotonic() - start.monotonic_at
