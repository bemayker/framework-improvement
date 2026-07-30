"""Unit tests for the notes schemas (backend/app/schemas/note.py).

Pure validation: no database, no HTTP client (`testing_standards.md` Section 1.1).
The blank and length rules are enforced by the schema alone, so this is where
they are covered rather than through the router integration tier.
"""

import pytest
from pydantic import ValidationError

from app.schemas.note import MAX_NOTE_LENGTH, NoteCreate


def test_note_create_stores_content_trimmed():
    """Happy path: surrounding whitespace is not part of the note."""
    assert NoteCreate(content="  Buy milk  ").content == "Buy milk"


@pytest.mark.parametrize("blank_content", ["", "   ", "\t\n "])
def test_note_create_with_blank_content_is_rejected(blank_content: str):
    """Error case: empty and whitespace-only content never reaches the service."""
    with pytest.raises(ValidationError):
        NoteCreate(content=blank_content)


def test_note_create_accepts_content_at_the_length_limit():
    """Edge case: the bound is inclusive, so a note of exactly the limit is valid."""
    content = "a" * MAX_NOTE_LENGTH

    assert NoteCreate(content=content).content == content


def test_note_create_over_the_length_limit_is_rejected():
    """Error case: one request cannot write an unbounded row (422, not 201)."""
    with pytest.raises(ValidationError):
        NoteCreate(content="a" * (MAX_NOTE_LENGTH + 1))
