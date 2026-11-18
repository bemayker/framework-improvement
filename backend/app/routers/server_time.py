"""Router for GET /api/time (FEAT-1).

No service module: reading the clock is neither business logic nor a
transactional boundary, so the one-line clock read lives here (planned
deviation, following TEST-06).
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime.

    A module-level function so tests can substitute the clock.
    """
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_time() -> ServerTimeResponse:
    """Report the server's current UTC time, computed per request."""
    return ServerTimeResponse(now=current_utc_time())
