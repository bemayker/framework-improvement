"""Router for GET /api/time (FEAT-1, restored by BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

router = APIRouter(prefix="/api", tags=["time"])

# The CDN in front of the API caches any response that carries no cache
# directive, which served a stale `now` on the deployed environment (BUG-01).
CACHE_CONTROL_NO_STORE = "no-store"


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, forbidding any cache from storing it."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_server_time(), timezone="UTC")
