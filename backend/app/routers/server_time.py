"""Router for GET /api/time (BUG-01).

The response carries `Cache-Control: no-store` so a CDN in front of the API
cannot serve one cached `now` to every caller.
"""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service

router = APIRouter(prefix="/api", tags=["server-time"])

NO_STORE = "no-store"


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the current UTC server time, marked as not cacheable."""
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(
        now=server_time_service.get_server_time(), timezone="UTC"
    )
