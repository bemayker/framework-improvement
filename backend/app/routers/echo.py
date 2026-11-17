"""Router for GET /api/echo (TEST-06).

Validation (required `msg`, 200-character bound) is declared on `EchoQuery`;
the handler holds no checks of its own.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.echo import EchoQuery, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse:
    """Return the given message unchanged."""
    return EchoResponse(echo=query.msg)
