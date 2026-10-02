"""Router for GET /api/echo (TEST-06)."""

from fastapi import APIRouter

from app.schemas.echo import EchoMessage, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: EchoMessage) -> EchoResponse:
    """Return the given message unchanged."""
    return EchoResponse(echo=msg)
