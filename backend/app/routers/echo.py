"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MESSAGE_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=ECHO_MESSAGE_MAX_LENGTH)],
) -> EchoResponse:
    """Return the `msg` query parameter verbatim.

    `msg` has no default, so FastAPI rejects a request without it as a 422;
    the length bound is parameter metadata, so an over-long value is rejected
    as the same 422 shape. Both come from the framework's own validation
    rather than from a check in this handler, which is what the acceptance
    criteria require.
    """
    return EchoResponse(echo=msg)
