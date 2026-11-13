"""Router for GET /api/time (FEAT-1)."""

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time() -> ServerTimeResponse:
    """Return the server's current time in UTC."""
    return ServerTimeResponse(now=get_server_time())
