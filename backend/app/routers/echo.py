"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(
    msg: Annotated[str, Query(max_length=MAX_ECHO_MESSAGE_LENGTH)],
) -> EchoResponse:
    """Return the given text unchanged; FastAPI answers 422 when it is missing or too long."""
    return EchoResponse(echo=msg)
