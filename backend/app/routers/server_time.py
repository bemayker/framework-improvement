"""Router for GET /api/time (FEAT-1)."""

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import UTC_TIMEZONE_NAME, get_current_utc_time

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current time in UTC."""
    return ServerTimeResponse(now=get_current_utc_time(), timezone=UTC_TIMEZONE_NAME)
