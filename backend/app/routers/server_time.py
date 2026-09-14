"""Router for GET /api/time (FEAT-1)."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.server_time import SERVER_TIMEZONE, ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time() -> ServerTimeResponse:
    """Report the server's current time, so a client can detect clock skew.

    The clock is read inside this handler on every call and nothing is cached,
    which is what "computed per request" means here. `datetime` is imported at
    module level so the unit tier can substitute a fake clock for it.
    """
    return ServerTimeResponse(now=datetime.now(timezone.utc), timezone=SERVER_TIMEZONE)
