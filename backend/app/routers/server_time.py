"""Router for GET /api/time."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the current UTC server time.

    `no-store` keeps the CDN in front of the deployed API from serving one
    cached `now` to every caller.
    """
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=get_server_time(), timezone="UTC")
