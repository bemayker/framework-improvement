"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Read the clock. A dependency so it runs per request and tests can override it."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(now: Annotated[datetime, Depends(utc_now)]) -> ServerTimeResponse:
    """Return the server's current time in UTC."""
    return ServerTimeResponse(now=now)
