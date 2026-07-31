"""Unit tests for the note schemas (backend/app/schemas/note.py)."""

from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.models.note import Note
from app.schemas.note import MAX_NOTE_TEXT_LENGTH, NoteCreateRequest, NoteResponse


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


def test_note_create_request_accepts_text_at_the_length_limit():
    """Edge case: exactly the maximum length is still a valid note."""
    at_limit = "n" * MAX_NOTE_TEXT_LENGTH

    assert NoteCreateRequest(text=at_limit).text == at_limit


def test_note_create_request_rejects_text_over_the_length_limit():
    """Error case: one character past the limit is rejected, so an unbounded
    payload can never reach the unbounded TEXT column."""
    with pytest.raises(ValidationError):
        NoteCreateRequest(text="n" * (MAX_NOTE_TEXT_LENGTH + 1))


def test_note_response_serialises_the_domain_dataclass():
    """The response schema reads the Note dataclass, so the router maps nothing by hand."""
    created_at = datetime(2026, 7, 31, 9, 15, tzinfo=UTC)

    response = NoteResponse.model_validate(Note(id=1, text="Buy milk", created_at=created_at))

    assert response.model_dump() == {"id": 1, "text": "Buy milk", "created_at": created_at}
