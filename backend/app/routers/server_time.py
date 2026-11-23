"""Router for GET /api/time (FEAT-1, recreated and fixed by BUG-01).

The response carries `Cache-Control: no-store` so a CDN in front of the API
never serves a stored copy: without a cache directive the deployed edge cache
returned the same `now` for repeated requests. The header is set on this route
only, so no other endpoint's caching behaviour changes.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import SERVER_TIMEZONE, get_server_time

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable by any intermediary."""
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)
