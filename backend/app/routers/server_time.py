"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request.

    Reading the clock is neither business logic nor a transaction, so there is
    deliberately no service layer here (planned deviation, as in the echo router).
    """
    # no-store keeps the edge CDN (and any other cache) from serving a stale `now` (BUG-01).
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=datetime.now(UTC))
