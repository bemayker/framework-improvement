"""Request/response schemas (DTOs) for the notes resource."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NoteCreate(BaseModel):
    content: str


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    created_at: datetime
