"""Schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# The single source of the input bound; applied to the query parameter by the
# router, not repeated on the response field (a second copy would turn a future
# mismatch into a 500).
ECHO_MESSAGE_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
