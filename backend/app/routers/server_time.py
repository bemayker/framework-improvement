"""Router for GET /api/time (FEAT-1).

No service module: reading the clock has no business rule, persistence or
transaction, so the router takes the clock as a dependency and builds the
schema. The dependency is evaluated per request and replaceable in tests.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Return the current instant as an aware UTC datetime."""
    return datetime.now(timezone.utc)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(now: datetime = Depends(utc_now)) -> ServerTimeResponse:
    """Return the server's current time in UTC."""
    return ServerTimeResponse(now=now, timezone="UTC")
