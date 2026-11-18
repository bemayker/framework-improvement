"""Router for GET /api/time (FEAT-1), with the BUG-01 cache directive."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

# The deployed CDN caches any response that carries no directive, which served
# a stale `now`. Scoped to this route: no other route's criteria name caching.
NO_STORE_CACHE_CONTROL = "no-store"

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked as not cacheable."""
    response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL
    return ServerTimeResponse(now=get_server_time())
