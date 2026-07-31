"""Request and response schemas for the notes endpoints (TEST-03)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

BLANK_TEXT_MESSAGE = "Note text must not be blank."

# Upper bound on a single note. The `notes.text` column is an unbounded
# PostgreSQL TEXT, so without this the request body size is the only limit on
# what one insert writes. 1000 characters is far above any realistic task note
# and keeps the endpoint's cost per request bounded.
MAX_NOTE_TEXT_LENGTH = 1000


class NoteCreateRequest(BaseModel):
    """Request body for POST /api/notes.

    The stored text is the stripped input, and blank input is rejected with a
    422: the frontend trims before validating, so both layers agree that a
    whitespace-only note is empty (see the plan's documented assumptions).

    The length bound is declared on the field rather than checked after
    stripping, so it appears as `maxLength` in the OpenAPI schema. It therefore
    measures the raw input; the frontend trims before sending, so for the real
    client the two measurements coincide.
    """

    text: str = Field(max_length=MAX_NOTE_TEXT_LENGTH)

    @field_validator("text")
    @classmethod
    def strip_and_reject_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError(BLANK_TEXT_MESSAGE)
        return stripped


class NoteResponse(BaseModel):
    """Response body for a single note.

    `from_attributes` lets FastAPI serialise the `Note` domain dataclass the
    service returns without the router mapping fields by hand.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    created_at: datetime
