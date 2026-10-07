"""Router for GET /api/ping (TEST-13)."""

from fastapi import APIRouter

from app.schemas.ping import PingResponse

router = APIRouter(prefix="/api", tags=["ping"])


@router.get("/ping", response_model=PingResponse)
def get_ping() -> PingResponse:
    """Liveness probe: always answers `{"pong": true}`."""
    return PingResponse(pong=True)
