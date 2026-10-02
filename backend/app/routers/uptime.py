"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services.uptime_service import compute_uptime_seconds

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Report how long the process has been running."""
    start = request.app.state.process_start
    return UptimeResponse(
        uptime_seconds=compute_uptime_seconds(start),
        started_at=start.started_at,
    )
