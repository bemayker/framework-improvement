"""Router for GET /api/time (FEAT-1, recreated by BUG-01 with Cache-Control: no-store)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time_endpoint(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, never cacheable by an edge cache."""
    # An edge cache in front of the API stores a response with no directive,
    # which served the same `now` to every caller; no-store forbids that.
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=get_server_time(), timezone="UTC")
