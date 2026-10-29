"""Router for GET /api/echo (FEAT-1). Returns `msg` verbatim, no service."""

from fastapi import APIRouter

from app.schemas.echo import EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: str) -> EchoResponse:
    """Return the `msg` query parameter unchanged."""
    return EchoResponse(echo=msg)
