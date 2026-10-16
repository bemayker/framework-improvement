"""Router for GET /api/time (FEAT-1).

No service module: reading the clock is neither business logic nor a
transactional boundary (planned deviation from coding_standards.md 2.2,
same decision as TEST-06).

BUG-01: the response carries Cache-Control: no-store so an edge cache never
serves a stale time.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

# An edge cache in front of the API otherwise stores the response and serves a stale "now".
NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request."""
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(now=datetime.now(UTC), timezone="UTC")
