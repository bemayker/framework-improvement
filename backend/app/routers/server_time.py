"""Router for GET /api/time (BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_current_utc_time

# Why: the CDN in front of the deployed API caches responses that carry no
# cache directive, so two requests a second apart returned the same `now`.
# Locally nothing caches, so this header has no visible effect here; do not
# remove it as redundant. Scoped to this route, never app-wide.
CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the current server time in UTC, uncacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")
