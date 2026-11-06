"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_current_utc_time

router = APIRouter(prefix="/api", tags=["time"])

NO_STORE_CACHE_CONTROL = "no-store"


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the current server time in UTC."""
    # Why: the deployed CDN caches responses that carry no cache directive, which
    # served a stale `now`. Nothing local caches, so this header has no local effect.
    response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL
    return ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")
