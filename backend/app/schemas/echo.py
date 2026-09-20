"""Response schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
