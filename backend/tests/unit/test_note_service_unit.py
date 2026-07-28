"""Unit tests for NoteService against a stub repository (no database,
`testing_standards.md` Section 1.1)."""

import pytest

from app.core.exceptions import EmptyNoteError
from app.models.note import Note
from app.schemas.note import NoteCreate
from app.services.note_service import NoteService


class _StubSession:
    """Records whether the service committed, without touching a real database."""

    def __init__(self) -> None:
        self.commit_count = 0

    def commit(self) -> None:
        self.commit_count += 1


class _StubRepository:
    """In-memory stand-in for NoteRepository, matching its public shape."""

    def __init__(self) -> None:
        self.session = _StubSession()
        self._notes: list[Note] = []
        self._next_id = 1

    def add(self, text: str) -> Note:
        note = Note(id=self._next_id, text=text)
        self._next_id += 1
        self._notes.append(note)
        return note

    def list_all(self) -> list[Note]:
        return list(reversed(self._notes))


def test_create_note_with_surrounding_whitespace_trims_text_and_commits():
    """Happy path: surrounding whitespace is trimmed before persisting."""
    repository = _StubRepository()
    service = NoteService(repository)

    note = service.create_note(NoteCreate(text="  Buy milk  "))

    assert note.text == "Buy milk"
    assert repository.session.commit_count == 1


def test_create_note_at_500_character_boundary_is_accepted():
    """Edge case: exactly the 500-character maximum is accepted unchanged."""
    repository = _StubRepository()
    service = NoteService(repository)
    text = "a" * 500

    note = service.create_note(NoteCreate(text=text))

    assert note.text == text
    assert len(note.text) == 500


def test_create_note_with_whitespace_only_text_raises_empty_note_error():
    """Error case: whitespace-only text is rejected and nothing is committed."""
    repository = _StubRepository()
    service = NoteService(repository)

    with pytest.raises(EmptyNoteError):
        service.create_note(NoteCreate(text="   "))

    assert repository.session.commit_count == 0


def test_list_notes_returns_all_notes_newest_first():
    """Happy path: list_notes delegates to the repository unchanged."""
    repository = _StubRepository()
    service = NoteService(repository)
    service.create_note(NoteCreate(text="first"))
    service.create_note(NoteCreate(text="second"))

    notes = service.list_notes()

    assert [note.text for note in notes] == ["second", "first"]
