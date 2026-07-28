"""Request/response DTOs for notes. Kept separate from the ORM model.

`NoteCreate.text` carries only the max-length bound; whether the (trimmed)
text is non-empty is a business rule enforced by `NoteService`, not a schema
constraint, so every blank-text rejection — empty string or whitespace-only —
produces the same `{"detail": "..."}` response shape (see the API Contract
in the plan) instead of two different error shapes depending on which layer
caught it.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteCreate(BaseModel):
    text: str = Field(max_length=500)


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    created_at: datetime
