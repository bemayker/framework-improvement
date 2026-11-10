"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)],
) -> EchoResponse:
    """Return the text it was given.

    `msg` has no default, so FastAPI answers 422 when it is absent, and the
    declared max_length makes it answer 422 when the text is too long.
    """
    return EchoResponse(echo=msg)
