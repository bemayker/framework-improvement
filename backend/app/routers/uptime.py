"""Router for GET /api/uptime (TEST-07)."""

import time
from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.uptime import UptimeResponse

router = APIRouter(prefix="/api", tags=["uptime"])

# Two clocks are read once here, when app.main imports this module at process
# start, because they answer two different questions. STARTED_AT is the wall
# clock, which is what a person reads as a start time; STARTED_AT_MONOTONIC is
# the monotonic clock, which cannot step backwards on an NTP correction, so
# elapsed time measured against it is non-negative and increasing by
# construction rather than by a clamp.
STARTED_AT: datetime = datetime.now(timezone.utc)
STARTED_AT_MONOTONIC: float = time.monotonic()


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime() -> UptimeResponse:
    """Report how long this process has been running.

    Both module constants are read through the module globals at call time
    rather than bound as defaults, so the unit tier can substitute a fake
    clock for `time` and a known reading for `STARTED_AT_MONOTONIC`.
    """
    return UptimeResponse(
        uptime_seconds=time.monotonic() - STARTED_AT_MONOTONIC,
        started_at=STARTED_AT,
    )
