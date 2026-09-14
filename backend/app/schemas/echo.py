"""Response schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# The bound is declared here rather than in the router so it has one source:
# the router imports it for Query(max_length=...) and the tests import it for
# their boundary cases, instead of restating the literal.
ECHO_MESSAGE_MAX_LENGTH: int = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
