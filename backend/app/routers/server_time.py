"""Router for GET /api/time."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_current_utc_time

router = APIRouter(prefix="/api", tags=["time"])

# The CDN in front of the deployed API caches any response without a cache
# directive and then serves a stale `now`. The header has no effect locally
# (nothing caches there), so it must not be removed as redundant.
CACHE_CONTROL_NO_STORE = "no-store"


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the current server time in UTC, marked as not cacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")
