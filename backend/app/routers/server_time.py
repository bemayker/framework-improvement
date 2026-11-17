"""Router for GET /api/time (BUG-01).

The route sets `Cache-Control: no-store` itself rather than through a global
middleware: the CDN served this endpoint's response stale because it carried
no cache directive, and only this endpoint's value is per-request time.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import SERVER_TIMEZONE, get_server_time

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable by shared caches."""
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)
