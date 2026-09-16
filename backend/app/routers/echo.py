"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: Annotated[str, Query(max_length=200)]) -> EchoResponse:
    """Return the given message unchanged.

    `msg` has no default, so a missing value and an over-length value are
    both rejected by FastAPI's own request validation (422) before this
    function body runs; neither case is checked here.
    """
    return EchoResponse(echo=msg)
