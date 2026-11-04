"""Response schema and input bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Single source for the longest accepted `msg`; the router declares it on the
# query parameter so FastAPI validates it and publishes it as OpenAPI maxLength.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
