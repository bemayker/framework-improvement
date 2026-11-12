"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Return how long this application instance has been running."""
    stamp = request.app.state.startup
    return UptimeResponse(
        uptime_seconds=uptime_service.compute_uptime_seconds(stamp),
        started_at=stamp.started_at,
    )
