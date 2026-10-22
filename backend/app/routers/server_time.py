"""Router for GET /api/time (FEAT-1).

Planned deviation from coding_standards.md Section 2.2: no service layer. Reading
the system clock is neither business logic nor a transactional boundary.

BUG-01: the response carries `Cache-Control: no-store` because the CDN in front of
the deployed API cached it (no cache directive), serving a stale `now`.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request."""
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=datetime.now(timezone.utc), timezone="UTC")
