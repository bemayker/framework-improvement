"""Response schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared on the endpoint's `msg` parameter, so FastAPI enforces it and
# publishes it as `maxLength` in the OpenAPI document.
ECHO_MESSAGE_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
