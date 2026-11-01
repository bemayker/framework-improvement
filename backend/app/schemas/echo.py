"""Schema for GET /api/echo (TEST-06)."""

from pydantic import BaseModel, Field

# Declared once here; the router feeds it to Query(max_length=...) so the
# bound lives in the schema module and not in a handler-side check.
MAX_ECHO_MESSAGE_LENGTH = 200


class EchoResponse(BaseModel):
    echo: str = Field(max_length=MAX_ECHO_MESSAGE_LENGTH)
