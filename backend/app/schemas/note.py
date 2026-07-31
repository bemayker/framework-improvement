"""Request and response schemas for the notes endpoints (TEST-03)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

BLANK_TEXT_MESSAGE = "Note text must not be blank."


class NoteCreateRequest(BaseModel):
    """Request body for POST /api/notes.

    The stored text is the stripped input, and blank input is rejected with a
    422: the frontend trims before validating, so both layers agree that a
    whitespace-only note is empty (see the plan's documented assumptions).
    """

    text: str

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
