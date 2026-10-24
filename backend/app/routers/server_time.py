"""Router for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Read the clock; module-level so tests can substitute it."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current time, computed per request.

    BUG-01: edge caches must not store a per-request clock value, so the
    response carries Cache-Control: no-store.
    """
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=utc_now(), timezone="UTC")
