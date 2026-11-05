"""Router for GET /api/time (FEAT-1).

No service module, a planned deviation from the Router, Service, Repository
layering: reading the clock is neither business logic nor a transactional
boundary, and there is no data access.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Return the current aware UTC time; the only place the clock is read."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current time, computed afresh on every request."""
    return ServerTimeResponse(now=utc_now())
