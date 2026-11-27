"""Router for GET /api/time (FEAT-1, BUG-01).

BUG-01: the deployed CDN cached this response because it carried no cache
directive, so the header is set here, on this one route, rather than by a
middleware that would change every route.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

CACHE_CONTROL_NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time_endpoint(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked as not cacheable."""
    response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE
    return ServerTimeResponse(now=get_server_time(), timezone="UTC")
