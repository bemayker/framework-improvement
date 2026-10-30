"""Router for GET /api/time (BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

# The CDN in front of the API caches any response that carries no cache
# directive, which served a stale time; no-store forbids every cache from
# keeping this response.
NO_STORE_CACHE_CONTROL = "no-store"

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable."""
    response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL
    return ServerTimeResponse.now_utc()
