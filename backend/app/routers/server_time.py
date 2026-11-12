"""Router for GET /api/time (FEAT-1).

No service layer on purpose: reading a clock is neither business logic nor a
transactional boundary, so the router builds the response directly.
"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Return the current time as an aware UTC datetime.

    A FastAPI dependency, evaluated on every request, so tests can override it.
    """
    return datetime.now(timezone.utc)


@router.get("/time", response_model=ServerTimeResponse)
def get_time(now: Annotated[datetime, Depends(utc_now)]) -> ServerTimeResponse:
    """Return the server's current UTC time."""
    return ServerTimeResponse(now=now)
