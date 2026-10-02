"""Schemas for the echo endpoint (TEST-06)."""

from typing import Annotated

from fastapi import Query
from pydantic import BaseModel

ECHO_MSG_MAX_LENGTH = 200

# The bound is declared here, once, so FastAPI's request validation rejects an
# over-length value with its standard 422; the handler holds no length check.
EchoMessage = Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
