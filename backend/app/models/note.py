"""Domain model for a saved note (TEST-03).

Deliberately separate from the Pydantic schemas in app/schemas/note.py: the
repository returns these, the router serialises them (coding_standards.md
Section 2.2, points 4 and 5).
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Note:
    """A note as stored in the `notes` table."""

    id: int
    text: str
    created_at: datetime
