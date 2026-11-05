"""Response schema and input bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

MAX_ECHO_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
