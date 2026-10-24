"""Response schema for GET /api/echo (TEST-06)."""

from pydantic import BaseModel

# Declared here, next to the schema, and used as the query parameter's
# `max_length` so FastAPI enforces it and OpenAPI publishes it.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """The text the caller sent, returned unchanged."""

    echo: str
