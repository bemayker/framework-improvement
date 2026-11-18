"""Router for the server time endpoint (BUG-01): GET /api/time."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service

# The CDN in front of the deployed API caches any response without a cache
# directive, which served a stale `now`; no-store forbids storing it.
CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked uncacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(
        now=server_time_service.get_server_time(), timezone="UTC"
    )
