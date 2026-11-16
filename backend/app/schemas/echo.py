"""Query and response schemas for the echo endpoint (TEST-06).

The length bound lives on the query model, not in the handler, so FastAPI's
own validation produces the 422 and the rule is stated in one place.
"""

from pydantic import BaseModel, Field

ECHO_MSG_MAX_LENGTH = 200


class EchoQuery(BaseModel):
    """Query string for GET /api/echo."""

    msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
