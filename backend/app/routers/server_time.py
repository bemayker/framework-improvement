"""Router for GET /api/time (BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

# The CDN in front of the deployed API caches a response that carries no
# directive, replaying one stale "now"; no-store forbids storing it at all.
CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse.now_utc()
