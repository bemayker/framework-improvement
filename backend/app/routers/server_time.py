"""Router for GET /api/time (BUG-01).

The no-store directive is set here, on this route only: the CDN in front of the
deployed API cached this response because it carried no cache directive, and a
global middleware would change caching for the other routes too.
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
