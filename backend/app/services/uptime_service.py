"""Business logic for the uptime endpoint (TEST-07).

The start instant is captured once per process, from the `lifespan` startup
hook in `backend/app/main.py`, not at module import: a module is imported by
tooling, by pytest collection, and by a reloader's child import without the
application ever serving a request, so an import-time capture would answer a
different question from the one criterion 3 asks ("captured once at
application startup").

Elapsed time is computed from `time.monotonic()` rather than by subtracting
two `datetime.now(timezone.utc)` readings, because a wall-clock subtraction
can move backwards when the host clock is stepped (an NTP correction, a VM
resume, a manual clock change), while criterion 2 requires `uptime_seconds`
to be non-negative and increasing. The monotonic clock is guaranteed
non-decreasing, so the criterion holds by construction rather than by a
`max(0.0, ...)` clamp that would hide the anomaly.
"""

import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_started_at: datetime | None = None
_monotonic_start: float | None = None


@dataclass(frozen=True)
class UptimeSnapshot:
    """The outcome of one uptime read: the start instant and elapsed seconds."""

    started_at: datetime
    uptime_seconds: float


def record_start() -> None:
    """Capture the process start instant, once per process.

    Idempotent: a second call is a no-op, so calling this from a startup hook
    that could in principle run more than once in a process never overwrites
    the value already captured.
    """
    global _started_at, _monotonic_start
    if _started_at is not None:
        return
    # Assign _monotonic_start before _started_at: both guards in this module
    # key on _started_at alone (this one and the one in get_uptime()), so
    # _started_at must be the *last* write. Writing it first would make
    # "_started_at set, _monotonic_start None" a real intermediate state that
    # a re-entered record_start() could observe and early-return from without
    # repairing.
    captured_monotonic = time.monotonic()
    captured_started_at = datetime.now(timezone.utc)
    _monotonic_start = captured_monotonic
    _started_at = captured_started_at


def get_uptime() -> UptimeSnapshot:
    """Return the current uptime snapshot.

    Falls back to capturing the start instant now, with a logged warning,
    when nothing was recorded yet — the case of an app instantiated without
    its lifespan running (a bare `TestClient(app)` outside a `with` block).
    The endpoint must answer 200 rather than 500, so this failure mode is
    absorbed here rather than propagated.
    """
    if _started_at is None or _monotonic_start is None:
        logger.warning(
            "get_uptime() called with no recorded start; capturing now. "
            "This means record_start() was never called from the lifespan "
            "startup hook (e.g. the app was used without running its lifespan)."
        )
        record_start()

    started_at = _started_at
    monotonic_start = _monotonic_start
    if started_at is None or monotonic_start is None:
        # Type-narrowing guard, not an unreachable branch: record_start()
        # above always leaves both globals set once it returns, but this
        # reads them into locals only after that call, so mypy cannot see
        # the invariant across the two statements without the guard.
        raise RuntimeError("uptime start was not captured")

    uptime_seconds = round(time.monotonic() - monotonic_start, 3)
    return UptimeSnapshot(started_at=started_at, uptime_seconds=uptime_seconds)
