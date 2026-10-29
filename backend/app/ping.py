"""GET /api/ping (FEAT-10): liveness ping that needs no database.

The router and its response model live together in this one module because
the handler returns a constant: there is no business logic to put in a service.
"""

from fastapi import APIRouter
from pydantic import BaseModel

STATUS_OK = "ok"

router = APIRouter(prefix="/api", tags=["ping"])


class PingResponse(BaseModel):
    status: str


@router.get("/ping", response_model=PingResponse)
def get_ping() -> PingResponse:
    return PingResponse(status=STATUS_OK)
