"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services.uptime_service import compute_uptime

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return when the process started and how long it has been running."""
    clock = request.app.state.startup_clock
    return UptimeResponse(
        uptime_seconds=compute_uptime(clock),
        started_at=clock.started_at,
    )
