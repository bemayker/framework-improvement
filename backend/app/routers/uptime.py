"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime() -> UptimeResponse:
    """Report how long this process has been running, and when it started."""
    report = uptime_service.get_uptime()
    return UptimeResponse(
        uptime_seconds=report.uptime_seconds,
        started_at=report.started_at,
    )
