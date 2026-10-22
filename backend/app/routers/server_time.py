"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def current_utc_time() -> datetime:
    """Read the clock; a module-level function so tests can patch it by name."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, read on every request."""
    # A per-request clock reading must never be stored: the CDN in front of the
    # API caches any response that carries no cache directive (BUG-01).
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=current_utc_time())
