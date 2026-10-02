"""Router for GET /api/time (FEAT-1).

Planned deviation from the Router -> Service layering: reading the clock is
neither business logic nor a transactional boundary, so the router calls
``datetime.now`` directly, like the echo router (stakeholder instruction).

BUG-01: the response carries ``Cache-Control: no-store`` so a shared cache (the
CDN on the deployed environment) never replays a stale time.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.schemas.server_time import ServerTimeResponse

NO_STORE = "no-store"

router = APIRouter(prefix="/api", tags=["time"])


@router.get("/time", response_model=ServerTimeResponse)
def get_time(response: Response) -> ServerTimeResponse:
    """Return the server's current time in UTC, computed per request.

    The value changes on every request, so no shared cache may store it (BUG-01).
    """
    response.headers["Cache-Control"] = NO_STORE
    return ServerTimeResponse(now=datetime.now(UTC))
