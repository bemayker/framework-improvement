"""Router for GET /api/time (BUG-01, recreating FEAT-1's endpoint)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time."""
    # no-store stops a CDN in front of the API from serving one cached `now`.
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=get_server_time(), timezone="UTC")
