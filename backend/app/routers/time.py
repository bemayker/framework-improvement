"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.time import TimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=TimeResponse)
def get_time() -> TimeResponse:
    """Return the server's current instant in UTC.

    The clock is read inline, on every call, with no module-level constant
    and no cache, which is what makes per-request freshness true by
    construction rather than by convention.
    """
    return TimeResponse(now=datetime.now(UTC))
