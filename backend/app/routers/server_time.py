"""Router for GET /api/time (FEAT-1, recreated by BUG-01).

BUG-01: the CDN in front of the deployed API cached this response because it
carried no cache directive, so `no-store` is set here, on this route only. An
app-wide middleware would widen the directive to every other route.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import UTC_TIMEZONE_NAME, get_current_utc_time

NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked as not cacheable."""
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(now=get_current_utc_time(), timezone=UTC_TIMEZONE_NAME)
