"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Read the clock; module-level so tests can substitute it."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current time, computed per request."""
    return ServerTimeResponse(now=utc_now(), timezone="UTC")
