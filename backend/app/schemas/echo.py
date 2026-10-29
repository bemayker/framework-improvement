"""Response schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared here, beside the schema, so the bound is stated once and the router
# references it rather than hand-checking length in the handler.
MAX_ECHO_MESSAGE_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
