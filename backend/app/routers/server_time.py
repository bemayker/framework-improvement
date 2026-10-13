"""Router for GET /api/time (FEAT-1)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, read afresh on every request."""
    # Without a directive the CDN caches this response and serves a stale time.
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=datetime.now(timezone.utc), timezone="UTC")
