"""Router for GET /api/echo (TEST-06)."""

from fastapi import APIRouter, Query

from app.schemas.echo import MAX_ECHO_MSG_LENGTH, EchoResponse

router = APIRouter(prefix="/api", tags=["echo"])


@router.get("/echo", response_model=EchoResponse)
def get_echo(msg: str = Query(max_length=MAX_ECHO_MSG_LENGTH)) -> EchoResponse:
    """Return the given message; FastAPI validates presence and length."""
    return EchoResponse(echo=msg)
