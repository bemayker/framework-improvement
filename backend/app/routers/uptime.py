"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long the application has been running and when it started."""
    start = uptime_service.get_start_mark(request.app.state)
    return UptimeResponse(
        uptime_seconds=uptime_service.uptime_seconds(start),
        started_at=start.started_at,
    )
