"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import SERVER_TIMEZONE, get_server_time

NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked uncacheable.

    The header is set here, not in app-wide middleware: the CDN in front of the
    deployed API cached this response because it carried no cache directive
    (BUG-01), and no other route's behaviour should change for that.
    """
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)
