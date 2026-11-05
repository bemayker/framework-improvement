"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import MAX_ECHO_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: Annotated[str, Query(max_length=MAX_ECHO_LENGTH)]) -> EchoResponse:
    """Return the given text unchanged.

    `msg` has no default, so FastAPI rejects its absence with a 422; the length
    bound is declared on the parameter, so FastAPI rejects an over-long value
    with a 422 before this handler runs.
    """
    return EchoResponse(echo=msg)
