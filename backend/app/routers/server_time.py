"""Router for GET /api/time (FEAT-1)."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Read the clock; module-level so a test can substitute it."""
    return datetime.now(timezone.utc)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current time, read afresh on every request."""
    return ServerTimeResponse(now=current_utc_time())
