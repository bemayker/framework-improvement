"""Router for GET /api/echo (FEAT-1)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: Annotated[str, Query()]) -> EchoResponse:
    """Return the `msg` query parameter verbatim."""
    return EchoResponse(echo=msg)
