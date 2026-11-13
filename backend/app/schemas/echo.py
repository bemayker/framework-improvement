"""Response schema for the echo endpoint (FEAT-1)."""

from pydantic import BaseModel


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
