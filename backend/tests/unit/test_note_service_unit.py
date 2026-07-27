"""Unit tests for `NoteService` (backend/app/services/note_service.py).

The repository is a hand-rolled fake: no database is involved
(`testing_standards.md` §1.1).
"""

from datetime import UTC, datetime

import pytest

from app.core.exceptions import EmptyNoteError
from app.models.note import Note
from app.services.note_service import NoteService


class FakeSession:
    """Records whether `commit()` was called; nothing else is needed."""

    def __init__(self) -> None:
        self.commit_calls = 0

    def commit(self) -> None:
        self.commit_calls += 1


class FakeNoteRepository:
    """In-memory stand-in for `NoteRepository`."""

    def __init__(self, existing: list[Note] | None = None) -> None:
        self._notes: list[Note] = existing or []
        self.add_calls: list[str] = []
        self._next_id = len(self._notes) + 1

    def add(self, content: str) -> Note:
        self.add_calls.append(content)
        note = Note(id=self._next_id, content=content, created_at=datetime.now(UTC))
        self._next_id += 1
        self._notes.append(note)
        return note

    def list_all(self) -> list[Note]:
        return list(self._notes)


def test_create_note_with_valid_content_stores_it_and_commits():
    """Happy path: valid content is trimmed, stored once, and committed."""
    session = FakeSession()
    repository = FakeNoteRepository()
    service = NoteService(session, repository)

    note = service.create_note("Buy milk")

    assert note.content == "Buy milk"
    assert repository.add_calls == ["Buy milk"]
    assert session.commit_calls == 1


def test_create_note_trims_surrounding_whitespace():
    """Edge case: surrounding whitespace is trimmed before storing."""
    session = FakeSession()
    repository = FakeNoteRepository()
    service = NoteService(session, repository)

    note = service.create_note("  Call the dentist  ")

    assert note.content == "Call the dentist"
    assert repository.add_calls == ["Call the dentist"]


@pytest.mark.parametrize("content", ["", "   "])
def test_create_note_with_empty_or_whitespace_content_raises_and_does_not_call_repository(
    content: str,
):
    """Error case: empty/whitespace-only content is rejected before the repository runs."""
    session = FakeSession()
    repository = FakeNoteRepository()
    service = NoteService(session, repository)

    with pytest.raises(EmptyNoteError):
        service.create_note(content)

    assert repository.add_calls == []
    assert session.commit_calls == 0


def test_list_notes_returns_empty_list_when_none_exist():
    """Edge case: an empty repository yields an empty list, not an error."""
    session = FakeSession()
    repository = FakeNoteRepository()
    service = NoteService(session, repository)

    assert service.list_notes() == []


def test_list_notes_returns_all_stored_notes():
    """Happy path: existing notes are returned via the repository."""
    session = FakeSession()
    existing = [Note(id=1, content="Buy milk", created_at=datetime.now(UTC))]
    repository = FakeNoteRepository(existing=existing)
    service = NoteService(session, repository)

    notes = service.list_notes()

    assert [n.content for n in notes] == ["Buy milk"]
