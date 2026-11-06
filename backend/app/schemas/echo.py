"""Schemas for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared once here and applied through the router's Query(max_length=...), so
# FastAPI enforces it and publishes it as maxLength in the OpenAPI document.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
