"""Router for GET /api/health (TEST-02)."""

from fastapi import APIRouter, Response, status

from app.schemas.health import HealthResponse
from app.services.health_service import check_database_connectivity

router = APIRouter(prefix="/api", tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": HealthResponse}},
)
def get_health(response: Response) -> HealthResponse:
    """Report service liveness together with database connectivity.

    The 503 is set on the injected response rather than raised, so the body
    stays the declared `HealthResponse` on both paths instead of FastAPI's
    generic `{"detail": ...}` error shape.
    """
    if check_database_connectivity():
        return HealthResponse(status="ok")

    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(status="degraded")
