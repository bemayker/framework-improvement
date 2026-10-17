"""Router for GET /api/time (FEAT-1)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current time, read from the clock on every request."""
    # An edge cache in front of the API otherwise serves a stale `now`.
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=datetime.now(timezone.utc))
