"""Response schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
