"""Router for GET /api/time (FEAT-1).

No service layer: reading the clock is neither business logic nor a
transactional boundary, and there is no data access.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read on every request."""
    return ServerTimeResponse(now=current_utc_time())
