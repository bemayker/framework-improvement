"""GET /api/ping (FEAT-10) and GET /api/ping/count (FEAT-11).

The ping needs no database. The count of answered pings is state with a
concurrency rule, so it lives in `app.services.ping_service`; this module
only routes and shapes responses.
"""

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.services.ping_service import PingCounter

STATUS_OK = "ok"

router = APIRouter(prefix="/api", tags=["ping"])


class PingResponse(BaseModel):
    status: str


class PingCountResponse(BaseModel):
    count: int


def get_ping_counter(request: Request) -> PingCounter:
    return request.app.state.ping_counter


@router.get("/ping", response_model=PingResponse)
def get_ping(counter: PingCounter = Depends(get_ping_counter)) -> PingResponse:
    counter.increment()
    return PingResponse(status=STATUS_OK)


@router.get("/ping/count", response_model=PingCountResponse)
def get_ping_count(
    counter: PingCounter = Depends(get_ping_counter),
) -> PingCountResponse:
    return PingCountResponse(count=counter.value())
