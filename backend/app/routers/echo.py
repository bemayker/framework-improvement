"""Router for GET /api/echo (TEST-06, TEST-11)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=MAX_ECHO_MESSAGE_LENGTH)],
) -> EchoResponse:
    """Return the given text with surrounding whitespace removed.

    `msg` is required and bounded declaratively, so FastAPI answers 422 for a
    missing or over-long value before this handler runs. The bound therefore
    applies to the value as sent, before trimming.
    """
    return EchoResponse(echo=msg.strip())
