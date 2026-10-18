"""Router for GET /api/time (FEAT-1).

Planned deviation from coding_standards.md Section 2.2: no service layer. Reading
the system clock is neither business logic nor a transactional boundary.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request.

    Sends `Cache-Control: no-store` because the edge cache on the deployed
    environment otherwise served a stale `now` for responses with no directive.
    """
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=datetime.now(timezone.utc), timezone="UTC")
