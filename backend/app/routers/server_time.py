"""Router for GET /api/time (FEAT-1).

No service layer, a planned deviation: the endpoint touches no persistence and
reading a clock is neither business logic nor a transactional boundary.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def _utc_now() -> datetime:
    """Return the current aware UTC time; the one seam tests patch."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request."""
    return ServerTimeResponse(now=_utc_now())
