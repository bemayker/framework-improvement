"""Request and response schemas for the notes endpoints (TEST-03)."""

from typing import Annotated

from pydantic import BaseModel, StringConstraints

# A note is one line of text, so an upper bound belongs in the contract: the
# column is TEXT and the CHECK only forbids blanks, which left megabyte-sized
# bodies acceptable and storable. The frontend mirrors this as the input's
# maxLength (NoteForm.tsx).
NOTE_TEXT_MAX_LENGTH = 500

# Surrounding whitespace is stripped before the length checks, so a
# whitespace-only body is rejected exactly like an empty one (422).
NoteText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=1, max_length=NOTE_TEXT_MAX_LENGTH
    ),
]


class NoteCreate(BaseModel):
    """Request body for POST /api/notes."""

    text: NoteText


class NoteResponse(BaseModel):
    """Response body for a single note."""

    id: int
    text: str
