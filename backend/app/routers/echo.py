"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import EchoQuery, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse:
    """Return the validated `msg` query parameter without surrounding whitespace."""
    return EchoResponse(echo=query.msg.strip())
