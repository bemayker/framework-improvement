"""Router for GET /api/time (BUG-01, restoring FEAT-1's endpoint)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import UTC_TIMEZONE_NAME, current_utc_time_iso

router = APIRouter(prefix="/api", tags=["server_time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time.

    `no-store` stops the CDN in front of the deployed API from serving a
    cached `now`; it is set on this route only, not app-wide.
    """
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=current_utc_time_iso(), timezone=UTC_TIMEZONE_NAME)
