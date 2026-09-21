"""Router for GET /api/uptime (TEST-07)."""

from fastapi import APIRouter

from app.schemas.uptime import UptimeResponse
from app.services.uptime_service import get_uptime

router = APIRouter(prefix="/api", tags=["uptime"])


@router.get("/uptime", response_model=UptimeResponse)
def get_uptime_route() -> UptimeResponse:
    """Return how long the process has been running.

    Maps the service's `UptimeSnapshot` onto the response schema; holds no
    business logic of its own (`coding_standards.md` Section 2.2).
    """
    snapshot = get_uptime()
    return UptimeResponse(
        uptime_seconds=snapshot.uptime_seconds, started_at=snapshot.started_at
    )
