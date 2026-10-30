"""Router for GET /api/time (FEAT-1).

Planned deviation from the Router, Service, Repository layering: reading a
clock is not business logic and has no transactional boundary, so there is no
service module; the router reads it through `current_utc_time`.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Return the current instant as an aware UTC datetime.

    Module-level so tests can substitute the clock.
    """
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request."""
    return ServerTimeResponse(now=current_utc_time())
