"""Router for GET /api/time (FEAT-1).

No service layer: reading the clock is neither business logic nor a
transactional boundary and has no failure mode for a service to absorb, so the
router reads it through `current_utc_time`, which tests replace.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_time() -> ServerTimeResponse:
    """Return the server's current UTC time, computed per request."""
    return ServerTimeResponse(now=current_utc_time())
