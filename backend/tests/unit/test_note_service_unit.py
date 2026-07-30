"""Unit tests for the note service (backend/app/services/note_service.py).

The repository is a stub implementing `NoteRepositoryProtocol`, so no database
is involved (`testing_standards.md` Section 1.1).
"""

import pytest

from app.core.exceptions import ValidationError
from app.models.note import Note
from app.services.note_service import NoteService


class StubNoteRepository:
    """In-memory stand-in for `NoteRepository`, recording what it was asked."""

    def __init__(self, notes: list[Note] | None = None) -> None:
        self.notes = list(notes or [])
        self.added_content: list[str] = []

    def add(self, content: str) -> Note:
        self.added_content.append(content)
        note = Note(id=len(self.notes) + 1, content=content)
        self.notes.append(note)
        return note

    def list_all(self) -> list[Note]:
        return list(self.notes)


def test_create_note_stores_content_and_returns_the_saved_note():
    """Happy path: the content reaches the repository and the note comes back."""
    repository = StubNoteRepository()
    service = NoteService(repository)

    note = service.create_note("Buy milk")

    assert repository.added_content == ["Buy milk"]
    assert note.content == "Buy milk"


def test_create_note_trims_surrounding_whitespace_before_storing():
    """Edge case: padding is not part of the note."""
    repository = StubNoteRepository()
    service = NoteService(repository)

    note = service.create_note("  Walk the dog\n")

    assert repository.added_content == ["Walk the dog"]
    assert note.content == "Walk the dog"


@pytest.mark.parametrize("blank_content", ["", "   ", "\t\n "])
def test_create_note_with_blank_content_raises_validation_error(blank_content: str):
    """Error case: blank content is rejected and nothing is written."""
    repository = StubNoteRepository()
    service = NoteService(repository)

    with pytest.raises(ValidationError):
        service.create_note(blank_content)

    assert repository.added_content == []


def test_create_note_validation_error_maps_to_422():
    """Error case: the raised error carries the HTTP status the handler uses."""
    service = NoteService(StubNoteRepository())

    with pytest.raises(ValidationError) as exc_info:
        service.create_note("")

    assert exc_info.value.status_code == 422


def test_list_notes_returns_the_repository_result():
    """Happy path: the service passes the repository's notes through."""
    stored = [Note(id=1, content="first"), Note(id=2, content="second")]
    service = NoteService(StubNoteRepository(stored))

    assert [note.content for note in service.list_notes()] == ["first", "second"]


def test_list_notes_returns_empty_list_when_none_exist():
    """Edge case: no notes yet is an empty list, not None."""
    service = NoteService(StubNoteRepository())

    assert service.list_notes() == []
