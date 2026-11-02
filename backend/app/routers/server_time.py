"""Router for GET /api/time (BUG-01, recreating FEAT-1)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_now

router = APIRouter(prefix="/api", tags=["time"])

# The CDN in front of the deployed API caches responses that carry no cache
# directive, which served a stale "now"; no-store forbids storing this one.
CACHE_CONTROL_NO_STORE = "no-store"


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_server_now())
