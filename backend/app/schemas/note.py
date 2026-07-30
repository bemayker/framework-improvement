"""Request and response schemas for the notes endpoints (TEST-03).

Kept separate from the ORM model per `coding_standards.md` Section 2.2 point 4.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

# The `notes.content` column is unbounded `Text` and POST /api/notes is
# unauthenticated, so without a bound one request can write an arbitrarily large
# row. A note is a short reminder; 1000 characters is far above any real one.
MAX_NOTE_LENGTH = 1000


class NoteCreate(BaseModel):
    """Request body for POST /api/notes."""

    content: str = Field(max_length=MAX_NOTE_LENGTH)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        """Reject empty and whitespace-only content, and store it trimmed.

        Whitespace-only counts as empty: the frontend trims before deciding
        whether to call the API, so the backend applies the same definition
        rather than a laxer one.
        """
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("content must not be empty or whitespace-only")
        return trimmed


class NoteResponse(BaseModel):
    """Response body for a single note."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    created_at: datetime
