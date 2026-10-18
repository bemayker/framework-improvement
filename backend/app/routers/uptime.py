"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long the application has been running and when it started."""
    mark = request.app.state.uptime_start
    return UptimeResponse(
        uptime_seconds=uptime_service.elapsed_seconds(mark),
        started_at=mark.started_at,
    )
