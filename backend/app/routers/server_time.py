"""Router for GET /api/time (BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_current_utc_time

# The CDN in front of the deployed API caches any response with no cache
# directive, which served a stale `now`; `no-store` forbids every cache.
NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable."""
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(now=get_current_utc_time())
