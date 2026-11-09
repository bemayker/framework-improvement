"""Router for GET /api/time (BUG-01, recreating FEAT-1's contract)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_current_utc_time

# Why: the CDN in front of the API caches any response without a cache
# directive, which served the same `now` to every client on the deployed host.
CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable by any intermediary."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")
