"""Router for GET /api/health (TEST-02; FEAT-5 adds the green/red health field)."""

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
    # One boolean drives both the status code and the health colour so the two
    # can never disagree.
    is_healthy = report.status == health_service.STATUS_OK
    body = HealthResponse(
        status=report.status,
        health="green" if is_healthy else "red",
        database=DatabaseTarget(host=report.host, port=report.port),
    )
    status_code = (
        status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(status_code=status_code, content=body.model_dump())
