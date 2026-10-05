"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Report seconds since startup and the startup moment captured once by lifespan."""
    process_start = request.app.state.process_start
    return UptimeResponse(
        uptime_seconds=uptime_service.get_uptime_seconds(process_start),
        started_at=process_start.started_at,
    )
