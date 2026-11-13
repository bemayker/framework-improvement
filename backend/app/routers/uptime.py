"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime() -> UptimeResponse:
    """Return how long the process has been running and when it started."""
    return UptimeResponse(
        uptime_seconds=uptime_service.get_uptime_seconds(),
        started_at=uptime_service.get_started_at(),
    )
