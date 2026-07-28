"""Request and response schemas for the notes endpoints (TEST-03)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NoteCreate(BaseModel):
    """Request body for POST /api/notes.

    The non-empty rule deliberately lives in the service layer rather than here,
    so the business rule has a single home and one error shape.
    """

    text: str


class NoteResponse(BaseModel):
    """Response body for a stored note."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    created_at: datetime
