"""Router for GET /api/time (FEAT-1).

No service module, by planned deviation: reading the clock is neither
business logic nor a transactional boundary, so a service would only be a
pass-through.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read on every request."""
    return ServerTimeResponse(now=datetime.now(UTC), timezone="UTC")
