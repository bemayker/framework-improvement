"""Router for GET /api/ping (FEAT-7)."""

from fastapi import APIRouter

from app.schemas.ping import PingResponse

router = APIRouter(prefix="/api", tags=["ping"])


@router.get("/ping", response_model=PingResponse)
def get_ping() -> PingResponse:
    """Answer a liveness ping with a constant pong."""
    return PingResponse(pong=True)
