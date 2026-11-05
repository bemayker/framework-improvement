"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long the process has been running and when it started."""
    process_start = request.app.state.process_start
    return UptimeResponse(
        uptime_seconds=uptime_service.elapsed_seconds(process_start),
        started_at=process_start.started_at,
    )
