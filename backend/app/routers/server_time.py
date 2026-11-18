"""Router for GET /api/time (BUG-01, recreating FEAT-1).

Every response carries `Cache-Control: no-store`: the CDN in front of the
deployed API cached this route because it had no cache directive, so two
requests a second apart returned the same `now`. The header is set on this
route only, not through middleware, because the defect is scoped to it.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import SERVER_TIMEZONE, get_current_utc_time

NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked as not cacheable."""
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(
        now=get_current_utc_time().isoformat(), timezone=SERVER_TIMEZONE
    )
