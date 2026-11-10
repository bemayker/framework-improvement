"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import SERVER_TIMEZONE, current_utc_iso

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time.

    `Cache-Control: no-store` stops a shared cache (the deployed CDN) from
    serving a stale `now`; scoped to this route, not app-wide.
    """
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=current_utc_iso(), timezone=SERVER_TIMEZONE)
