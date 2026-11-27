"""Router for GET /api/time (FEAT-1, BUG-01).

Every response carries `Cache-Control: no-store` so a CDN in front of the API
never serves a stale `now` (BUG-01). The header is set on this route only.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Return the current aware UTC time (a module-level seam for tests)."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked as not cacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=utc_now(), timezone="UTC")
