"""Router for GET /api/echo (TEST-06)."""

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: str = Query(max_length=ECHO_MSG_MAX_LENGTH)) -> EchoResponse:
    """Return the given `msg` unchanged; FastAPI rejects a missing or too-long one with 422."""
    return EchoResponse(echo=msg)
