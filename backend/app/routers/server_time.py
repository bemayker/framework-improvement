"""Router for GET /api/time (FEAT-1, restored with the BUG-01 fix).

Every response carries `Cache-Control: no-store`: without a cache directive
the CDN in front of the API served one cached `now` to every caller.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the current server time in UTC, marked as not cacheable."""
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=server_time_service.get_server_time(), timezone="UTC")
