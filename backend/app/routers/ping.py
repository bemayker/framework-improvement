"""Router for GET /api/ping (FEAT-4).

Planned deviation from coding_standards.md Section 2.2: no service layer. The
handler returns two constants, which is neither business logic nor a
transactional boundary. Only GET is declared; the framework answers any other
method with 405 {"detail": "Method Not Allowed"}.
"""

from fastapi import APIRouter

from app.schemas.ping import PingResponse

router = APIRouter(prefix="/api", tags=["ping"])


@router.get("/ping", response_model=PingResponse)
def get_ping() -> PingResponse:
    """Return the constant liveness body."""
    return PingResponse(status="ok", service="backend")
