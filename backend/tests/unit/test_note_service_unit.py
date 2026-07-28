"""Unit tests for NoteService (TEST-03).

The repository is stubbed, so these tests touch no database
(`testing_standards.md` Section 1.1).
"""

from datetime import UTC, datetime

import pytest

from app.core.exceptions import EmptyNoteError
from app.models.note import MAX_NOTE_LENGTH, Note
from app.schemas.note import NoteCreate
from app.services.note_service import NoteService


class StubNoteRepository:
    """In-memory stand-in for NoteRepository that records how it was called."""

    def __init__(self, existing: list[Note] | None = None) -> None:
        self.notes: list[Note] = list(existing or [])
        self.added_texts: list[str] = []
        self.commit_count = 0

    def add(self, text: str) -> Note:
        self.added_texts.append(text)
        note = Note(id=len(self.notes) + 1, text=text, created_at=datetime.now(UTC))
        self.notes.insert(0, note)
        return note

    def list_all(self) -> list[Note]:
        return list(self.notes)

    def commit(self) -> None:
        self.commit_count += 1


class FailingNoteRepository(StubNoteRepository):
    """Repository whose reads fail, standing in for a database outage."""

    def list_all(self) -> list[Note]:
        raise RuntimeError("connection to the database was lost")


def test_create_note_with_surrounding_whitespace_stores_trimmed_text():
    """Happy path: the note is trimmed, stored once, and the write is committed.

    The payload is built with model_construct so validation (which also strips)
    is bypassed and the service's own trimming is what is under test.
    """
    repository = StubNoteRepository()
    service = NoteService(repository)

    note = service.create_note(NoteCreate.model_construct(text="  Buy milk  "))

    assert repository.added_texts == ["Buy milk"]
    assert repository.commit_count == 1
    assert note.text == "Buy milk"


def test_create_note_at_maximum_length_stores_the_full_text():
    """Edge case: a note exactly at the length boundary is accepted unchanged."""
    repository = StubNoteRepository()
    service = NoteService(repository)
    text = "a" * MAX_NOTE_LENGTH

    note = service.create_note(NoteCreate(text=text))

    assert note.text == text
    assert len(repository.added_texts[0]) == MAX_NOTE_LENGTH
    assert repository.commit_count == 1


@pytest.mark.parametrize("blank_text", ["", "   ", "\n\t "])
def test_create_note_with_blank_text_raises_empty_note_error(blank_text: str):
    """Error case: nothing is written or committed when no text remains."""
    repository = StubNoteRepository()
    service = NoteService(repository)

    with pytest.raises(EmptyNoteError) as exc_info:
        service.create_note(NoteCreate.model_construct(text=blank_text))

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "Note text must not be empty."
    assert repository.added_texts == []
    assert repository.commit_count == 0


def test_list_notes_returns_the_repository_ordering_unchanged():
    """Happy path: ordering is the repository's concern, not the service's."""
    newest = Note(id=2, text="Call the dentist", created_at=datetime.now(UTC))
    oldest = Note(id=1, text="Buy milk", created_at=datetime.now(UTC))
    service = NoteService(StubNoteRepository([newest, oldest]))

    assert [note.text for note in service.list_notes()] == [
        "Call the dentist",
        "Buy milk",
    ]


def test_list_notes_returns_empty_list_when_none_exist():
    """Edge case: an empty store yields an empty list, never None."""
    service = NoteService(StubNoteRepository())

    assert service.list_notes() == []


def test_list_notes_propagates_a_repository_failure():
    """Error case: infrastructure failures are not swallowed into an empty list."""
    service = NoteService(FailingNoteRepository())

    with pytest.raises(RuntimeError):
        service.list_notes()
