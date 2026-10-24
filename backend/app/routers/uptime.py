"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services.uptime_service import get_uptime_seconds

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long this application instance has been running."""
    process_start = request.app.state.process_start
    return UptimeResponse(
        uptime_seconds=get_uptime_seconds(process_start),
        started_at=process_start.started_at,
    )
