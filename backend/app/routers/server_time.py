"""Router for GET /api/time (FEAT-1, BUG-01)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(response: Response) -> ServerTimeResponse:
    """Return the server's current time, read from the clock on every request.

    BUG-01: the CDN in front of the API cached this response because it carried
    no cache directive, so `no-store` tells the edge never to keep a copy.
    """
    response.headers["Cache-Control"] = "no-store"
    return ServerTimeResponse(now=datetime.now(timezone.utc))
