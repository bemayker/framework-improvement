"""Schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# The upper bound for `msg`, stated once here and declared on the query
# parameter so FastAPI enforces it (422) and OpenAPI documents it.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
