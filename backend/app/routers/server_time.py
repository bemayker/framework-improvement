"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service

router = APIRouter(prefix="/api", tags=["server-time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked uncacheable.

    `Cache-Control: no-store` is set here, on this route only: the CDN in front
    of the deployed API otherwise caches the response (BUG-01) and serves the
    same `now` to every client.
    """
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(
        now=server_time_service.get_server_time(),
        timezone=server_time_service.SERVER_TIMEZONE,
    )
