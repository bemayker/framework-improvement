"""Router for GET /api/time (BUG-01, recreating FEAT-1's endpoint).

The response carries `Cache-Control: no-store` so a CDN in front of the API
never serves a stale `now`.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked uncacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_server_time(), timezone="UTC")
