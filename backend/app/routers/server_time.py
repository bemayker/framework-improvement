"""Router for GET /api/time (FEAT-1).

Planned deviation from the Router -> Service layering: reading the clock is
neither business logic nor a transactional boundary, so the router calls
``datetime.now`` directly, like the echo router (stakeholder instruction).
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time() -> ServerTimeResponse:
    """Return the server's current time in UTC, computed per request."""
    return ServerTimeResponse(now=datetime.now(UTC))
