"""Schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Part of the public contract: callers rely on this bound, so it lives in one place.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
