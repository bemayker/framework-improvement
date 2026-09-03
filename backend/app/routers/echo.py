"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)],
) -> EchoResponse:
    """Return the text the caller supplied, unchanged.

    `msg` carries no default, so a missing one is a 422 from FastAPI's own
    request validation, and the length bound is declared on the parameter, so
    an over-long one is too. Neither is checked here.
    """
    return EchoResponse(echo=msg)
