"""Schema and bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared here so the bound is stated once, in the schema module; the router
# hands it to FastAPI's Query(max_length=...) rather than checking it by hand.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
