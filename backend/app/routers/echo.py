"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MESSAGE_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=ECHO_MESSAGE_MAX_LENGTH)],
) -> EchoResponse:
    """Return the given message unchanged.

    `msg` is required and bounded declaratively, so FastAPI answers 422 for a
    missing or over-long value before this body runs.
    """
    return EchoResponse(echo=msg)
