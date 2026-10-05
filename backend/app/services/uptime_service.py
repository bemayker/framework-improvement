"""Process uptime for GET /api/uptime (TEST-07).

The start moment is captured in the application's lifespan startup, never at
module import: import time equals process start only by coincidence of how the
process is launched, whereas the lifespan is the app's own startup event. The
monotonic reading is taken at the same moment as the wall-clock one, so uptime
cannot go backwards when the system clock is adjusted.
"""

import time
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessStart:
    """The moment the application started, as wall-clock and monotonic readings."""

    started_at: datetime
    monotonic_start: float


def capture_process_start() -> ProcessStart:
    """Read both clocks once, together."""
    return ProcessStart(
        started_at=datetime.now(timezone.utc),
        monotonic_start=time.monotonic(),
    )


def get_uptime_seconds(process_start: ProcessStart) -> float:
    """Seconds elapsed since `process_start`, measured on the monotonic clock."""
    return time.monotonic() - process_start.monotonic_start
