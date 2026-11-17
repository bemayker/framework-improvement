"""Router for GET /api/echo (TEST-06).

Missing and over-length `msg` values are rejected by FastAPI's own request
validation (422), so the handler holds no validation logic of its own.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)],
) -> EchoResponse:
    """Return the given message under the `echo` key."""
    return EchoResponse(echo=msg)
