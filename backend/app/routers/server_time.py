"""Router for GET /api/time (FEAT-1, with the BUG-01 cache directive)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_current_utc_time

router = APIRouter(prefix="/api", tags=["time"])

# The CDN in front of the deployed API caches any response that carries no
# cache directive, which froze `now`. Locally nothing caches, so this header
# has no visible effect here: do not remove it as redundant.
CACHE_CONTROL_NO_STORE = "no-store"


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the current server time in UTC, never cacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")
