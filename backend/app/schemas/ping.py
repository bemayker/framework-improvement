"""Response schema for the ping endpoint (FEAT-7)."""

from pydantic import BaseModel


class PingResponse(BaseModel):
    """Response body for GET /api/ping."""

    pong: bool
