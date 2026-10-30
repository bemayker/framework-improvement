"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long the process has been running and when it started."""
    clock = request.app.state.process_clock
    return UptimeResponse(
        uptime_seconds=uptime_service.uptime_seconds(clock),
        started_at=clock.started_at,
    )
