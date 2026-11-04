"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

# The answer differs on every request, so no cache (browser, proxy or CDN edge)
# may store or replay it.
NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the current server time in UTC, marked as not cacheable."""
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(now=get_server_time().isoformat(), timezone="UTC")
