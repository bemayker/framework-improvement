"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request.

    Reading the clock is neither business logic nor a transaction, so there is
    deliberately no service layer here (planned deviation, as in the echo router).
    """
    return ServerTimeResponse(now=datetime.now(UTC))
