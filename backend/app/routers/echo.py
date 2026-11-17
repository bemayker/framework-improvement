"""Router for GET /api/echo (FEAT-1).

`msg` has no default, so a missing parameter is FastAPI's own 422; the message
is returned verbatim, with no trimming and no length bound.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: Annotated[str, Query()]) -> EchoResponse:
    """Return the `msg` query parameter unchanged."""
    return EchoResponse(echo=msg)
