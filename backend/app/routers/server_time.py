"""Router for GET /api/time (FEAT-1).

Deliberately has no service layer: reading a clock involves no business rule,
persistence or transaction, so a service would be a pass-through.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.server_time import TimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Read the clock; kept as a function so a test can substitute it."""
    return datetime.now(timezone.utc)


@router.get("/time", response_model=TimeResponse)
def get_server_time() -> TimeResponse:
    """Return the server's current time in UTC, read fresh on every request."""
    return TimeResponse(now=current_utc_time())
