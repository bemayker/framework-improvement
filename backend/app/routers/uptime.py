"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter

from app.schemas.uptime import UptimeResponse
from app.services.uptime_service import get_uptime

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def read_uptime() -> UptimeResponse:
    """Return how long the process has been running and when it started."""
    report = get_uptime()
    return UptimeResponse(
        uptime_seconds=report.uptime_seconds, started_at=report.started_at
    )
