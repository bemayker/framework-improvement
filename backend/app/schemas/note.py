"""Request/response schemas for the notes endpoints (TEST-03).

Kept separate from the ORM model in app/models/note.py
(`coding_standards.md` Section 2.2).
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.note import MAX_NOTE_LENGTH


class NoteCreate(BaseModel):
    """Request body for POST /api/notes."""

    # Surrounding whitespace is stripped before validation, so an over-long
    # check is applied to the text that will actually be stored. Blank text is
    # deliberately *not* rejected here: the service raises EmptyNoteError so the
    # response carries the contract's machine-readable
    # {"detail": "Note text must not be empty."} rather than Pydantic's
    # array-shaped validation detail.
    model_config = ConfigDict(str_strip_whitespace=True)

    text: str = Field(max_length=MAX_NOTE_LENGTH)


class NoteRead(BaseModel):
    """Response body for a single note."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    created_at: datetime
