"""Router for GET /api/time (FEAT-1).

No service layer: reading a clock is neither business logic nor a
transactional boundary, so the handler calls the `utc_now` helper directly.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Return the current time as an aware UTC datetime (a seam for tests)."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request."""
    return ServerTimeResponse(now=utc_now())
