"""Domain model for a note (TEST-03).

Kept separate from the request/response schemas in app/schemas/note.py per
coding_standards.md Section 2.2: the schemas are the HTTP contract, this is
what the repository and service layers pass between themselves.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Note:
    """A stored note: its database identity and its text."""

    id: int
    text: str
