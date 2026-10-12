"""Router for GET /api/time (FEAT-1)."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request."""
    return ServerTimeResponse(now=datetime.now(timezone.utc), timezone="UTC")
