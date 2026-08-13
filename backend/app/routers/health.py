"""Router for GET /api/health (TEST-02)."""

from fastapi import APIRouter, Response, status
from fastapi.responses import JSONResponse

from app.schemas.health import DatabaseTarget, HealthResponse
from app.services import health_service

router = APIRouter(prefix="/api", tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": HealthResponse}},
)
def get_health() -> Response:
    """Report backend and database health.

    200 when the database answered the probe, 503 when it did not; the body
    carries the same schema either way so a client parses one shape.
    """
    report = health_service.get_health()
    body = HealthResponse(
        status=report.status,
        database=DatabaseTarget(host=report.host, port=report.port),
    )
    status_code = (
        status.HTTP_200_OK
        if report.status == health_service.STATUS_OK
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(status_code=status_code, content=body.model_dump())
