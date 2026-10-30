"""Router for GET /api/time (BUG-01)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

# The CDN in front of the API caches any response that carries no cache
# directive, which served a stale `now` on the deployed environment.
NO_STORE_CACHE_CONTROL = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


def utc_now() -> datetime:
    """Read the clock; a module-level function so tests can substitute it."""
    return datetime.now(UTC)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable by any shared cache."""
    response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL
    return ServerTimeResponse(now=utc_now())
