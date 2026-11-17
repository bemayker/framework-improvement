"""Router for GET /api/time (FEAT-1).

No service module: the endpoint has no persistence, transaction or business
rule. The clock read is a FastAPI dependency so it runs once per request and
tests can override it.
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_time(
    now: Annotated[datetime, Depends(current_utc_time)],
) -> ServerTimeResponse:
    """Return the server's current UTC time."""
    return ServerTimeResponse(now=now)
