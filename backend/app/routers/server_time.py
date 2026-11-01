"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import UTC_TIMEZONE_NAME, get_server_time

# The CDN in front of the deployed API caches responses that carry no cache
# directive, which served a stale `now`; no-store forbids any cache storing it.
NO_STORE_CACHE_CONTROL = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable."""
    response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL
    return ServerTimeResponse(
        now=get_server_time().isoformat(), timezone=UTC_TIMEZONE_NAME
    )
