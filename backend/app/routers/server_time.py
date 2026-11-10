"""Router for GET /api/time (FEAT-1).

No service module: reading a clock is neither business logic nor a
transactional boundary, so the router builds the response itself.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Read the clock; a named seam so tests can substitute it."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, computed on every request."""
    return ServerTimeResponse(now=current_utc_time())
