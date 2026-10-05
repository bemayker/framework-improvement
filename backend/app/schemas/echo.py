"""Schema and bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Single source of the bound: the router declares it on the query parameter.
MAX_ECHO_MESSAGE_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
