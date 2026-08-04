"""Request and response schemas for the notes endpoints (TEST-03)."""

from typing import Annotated

from pydantic import BaseModel, StringConstraints

# Surrounding whitespace is stripped before the length check, so a
# whitespace-only body is rejected exactly like an empty one (422).
NoteText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class NoteCreate(BaseModel):
    """Request body for POST /api/notes."""

    text: NoteText


class NoteResponse(BaseModel):
    """Response body for a single note."""

    id: int
    text: str
