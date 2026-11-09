"""Router for GET /api/echo (TEST-06)."""

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: str = Query(max_length=ECHO_MSG_MAX_LENGTH)) -> EchoResponse:
    """Return the given message unchanged."""
    return EchoResponse(echo=msg)
