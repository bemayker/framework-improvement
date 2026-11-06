"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long the application has been running and when it started."""
    report = uptime_service.get_uptime(request.app.state.start_mark)
    return UptimeResponse(
        uptime_seconds=report.uptime_seconds, started_at=report.started_at
    )
