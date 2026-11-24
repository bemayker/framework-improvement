"""Router for GET /api/time (FEAT-1).

There is deliberately no service layer: reading a clock is neither business
logic nor a transactional boundary, so the router reads it directly.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def _utc_now() -> datetime:
    """Return the current time as an aware UTC datetime (the clock seam tests patch)."""
    return datetime.now(timezone.utc)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read on every request."""
    return ServerTimeResponse(now=_utc_now())
