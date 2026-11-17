"""Router for GET /api/time (FEAT-1, BUG-01).

The response carries `Cache-Control: no-store` because the CDN in front of the
deployed API cached a response with no cache directive and served a stale
`now`. The directive is set on this route only, not app-wide.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service

NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, uncacheable by any edge cache."""
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(
        now=server_time_service.get_current_utc_time(),
        timezone=server_time_service.UTC_TIMEZONE_NAME,
    )
