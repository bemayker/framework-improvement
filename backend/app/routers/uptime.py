"""Router for GET /api/uptime (TEST-07)."""

import time

from fastapi import APIRouter, Request

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime(request: Request) -> UptimeResponse:
    """Report how long this process has run and when it started."""
    start = request.app.state.process_start
    return UptimeResponse(
        uptime_seconds=uptime_service.uptime_seconds(start, time.monotonic()),
        started_at=start.started_at,
    )
