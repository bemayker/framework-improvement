"""Response schema and input bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared on the `msg` query parameter so FastAPI answers 422 above this length.
MAX_ECHO_MSG_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
