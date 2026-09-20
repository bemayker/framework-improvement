"""Router for GET /api/echo (TEST-06)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: Annotated[str, Query(max_length=200)]) -> EchoResponse:
    """Return the `msg` query parameter's value back to the caller.

    `msg` has no default, so FastAPI's own request validation rejects a
    missing value with 422, and `max_length=200` rejects an over-long one the
    same way, both without a hand-rolled check in this body.
    """
    return EchoResponse(echo=msg)
