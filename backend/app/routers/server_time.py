"""Router for GET /api/time (FEAT-1).

No service layer: reading a clock is neither business logic nor a
transactional boundary, so the router builds the response itself (the same
decision as the TEST-06 echo router).
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.schemas.server_time import ServerTimeResponse

router = APIRouter(prefix="/api", tags=["time"])


def get_utc_now() -> datetime:
    """Return the current instant as an aware UTC datetime.

    Injected with `Depends`, which FastAPI resolves on every request, so the
    time is never cached; tests override it to feed fixed instants.
    """
    return datetime.now(timezone.utc)


@router.get("/time", response_model=ServerTimeResponse)
def get_server_time(now: datetime = Depends(get_utc_now)) -> ServerTimeResponse:
    """Return the server's current time in UTC."""
    return ServerTimeResponse(now=now)
