"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service

router = APIRouter(prefix="/api", tags=["server-time"])

# The one source of the directive; tests import it rather than restate the literal.
NO_STORE = "no-store"


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time.

    `Cache-Control: no-store` keeps an edge cache in front of the API from
    serving one stale `now` to every client (BUG-01).
    """
    response.headers["Cache-Control"] = NO_STORE
    current = server_time_service.get_server_time()
    return ServerTimeResponse(now=current.isoformat(), timezone="UTC")
