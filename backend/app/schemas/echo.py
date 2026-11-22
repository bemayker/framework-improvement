"""Schema and bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared once here so the router's Query(max_length=...) and the tests share it.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
