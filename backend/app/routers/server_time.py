"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Return the current aware UTC time.

    A dependency rather than an inline call so tests can substitute the clock
    through `app.dependency_overrides`.
    """
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_time(now: Annotated[datetime, Depends(utc_now)]) -> ServerTimeResponse:
    """Return the server's current time in UTC."""
    return ServerTimeResponse(now=now)
