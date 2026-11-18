"""Request and response schemas for the echo endpoint (TEST-06)."""

from pydantic import BaseModel, Field

# The bound lives here, on the schema, so FastAPI's request validation rejects
# an over-long msg with its standard 422 and the handler needs no check.
ECHO_MSG_MAX_LENGTH = 200


class EchoQuery(BaseModel):
    """Query string for GET /api/echo: one required, length-bounded msg."""

    msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
