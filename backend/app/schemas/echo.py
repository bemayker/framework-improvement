"""Schemas for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared on the query parameter so FastAPI validates it, documents it as
# `maxLength` in OpenAPI and formats the 422, instead of a check in the handler.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
