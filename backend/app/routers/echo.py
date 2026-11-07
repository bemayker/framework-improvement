"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)],
) -> EchoResponse:
    """Return the given text; FastAPI rejects a missing or over-long `msg` with 422."""
    return EchoResponse(echo=msg)
