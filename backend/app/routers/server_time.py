"""Router for GET /api/time (FEAT-1, BUG-01)."""

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current UTC time, marked uncacheable.

    `no-store` stops a CDN or browser keeping a response whose value is only
    right at the instant it was computed (BUG-01).
    """
    response.headers["Cache-Control"] = "no-store"
    return get_server_time()
