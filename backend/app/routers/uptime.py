"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services.uptime_service import uptime_seconds

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long the application has been running and when it started."""
    stamp = request.app.state.startup
    return UptimeResponse(
        uptime_seconds=uptime_seconds(stamp),
        started_at=stamp.started_at,
    )
