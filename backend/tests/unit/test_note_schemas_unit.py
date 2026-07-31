"""Unit tests for the note schemas (backend/app/schemas/note.py)."""

from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.models.note import Note
from app.schemas.note import NoteCreateRequest, NoteResponse


def test_note_create_request_accepts_non_blank_text():
    """Happy path: ordinary text validates and is preserved."""
    assert NoteCreateRequest(text="Buy milk").text == "Buy milk"


def test_note_create_request_strips_surrounding_whitespace():
    """Edge case: the stored text is the stripped input, matching the frontend's trim."""
    assert NoteCreateRequest(text="  Buy milk\n").text == "Buy milk"


@pytest.mark.parametrize("blank_text", ["", "   ", "\t\n "])
def test_note_create_request_rejects_blank_text(blank_text):
    """Error case: empty and whitespace-only input are both rejected."""
    with pytest.raises(ValidationError):
        NoteCreateRequest(text=blank_text)


def test_note_create_request_rejects_a_missing_text_field():
    """Error case: `text` is required, not defaulted to an empty note."""
    with pytest.raises(ValidationError):
        NoteCreateRequest()


def test_note_response_serialises_the_domain_dataclass():
    """The response schema reads the Note dataclass, so the router maps nothing by hand."""
    created_at = datetime(2026, 7, 31, 9, 15, tzinfo=UTC)

    response = NoteResponse.model_validate(Note(id=1, text="Buy milk", created_at=created_at))

    assert response.model_dump() == {"id": 1, "text": "Buy milk", "created_at": created_at}
