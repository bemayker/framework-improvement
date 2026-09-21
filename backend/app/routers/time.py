"""Router for GET /api/time (FEAT-1).

No service module: this endpoint is a single stdlib call with no branching,
no persistence and no transaction, so `coding_standards.md` Section 2.2's
Router -> Service -> Repository pattern (scoped to business logic and
transactional boundaries) does not apply. Recorded as a planned deviation in
the architect plan, per tracker comment point 4.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.time import TimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=TimeResponse)
def get_time() -> TimeResponse:
    """Return the server's current instant in UTC."""
    return TimeResponse(now=datetime.now(timezone.utc))
