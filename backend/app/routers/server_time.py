"""Router for GET /api/time (BUG-01).

The no-store directive is set on this route only, not as global middleware:
the CDN in front of the deployed API cached this response for lack of a
directive, and a global header would change caching of unrelated routes.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import SERVER_TIMEZONE, get_server_time

CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked as not cacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)
