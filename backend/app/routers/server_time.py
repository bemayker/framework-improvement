"""Router for GET /api/time (FEAT-1).

No service layer: reading the clock is neither business logic nor a
transactional boundary, so the router calls `utc_now()` directly.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Return the current aware UTC time; the seam tests patch."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current time, read afresh on every request."""
    return ServerTimeResponse(now=utc_now(), timezone="UTC")
