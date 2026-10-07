"""Schema for the ping endpoint (TEST-13)."""

from pydantic import BaseModel


class PingResponse(BaseModel):
    """Response body for GET /api/ping."""

    pong: bool
