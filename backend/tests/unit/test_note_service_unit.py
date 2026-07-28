"""Unit tests for the note service (backend/app/services/note_service.py).

The repository and the session are stubbed, so these tests exercise the one
business rule the feature has — trim, then reject blank text — with no database.
"""

import pytest

from app.core.exceptions import AppException, EmptyNoteError
from app.services import note_service


class StubNote:
    """Stands in for the ORM model the repository would return."""

    def __init__(self, text: str) -> None:
        self.text = text


class StubRepository:
    """Records the calls the service makes and returns canned results."""

    def __init__(self, notes: list[StubNote] | None = None) -> None:
        self.added_texts: list[str] = []
        self.list_all_calls = 0
        self._notes = notes if notes is not None else []

    def add(self, session: object, text: str) -> StubNote:
        self.added_texts.append(text)
        note = StubNote(text)
        self._notes.append(note)
        return note

    def list_all(self, session: object) -> list[StubNote]:
        self.list_all_calls += 1
        return list(self._notes)


SESSION = object()  # The service only passes the session through.


def test_create_note_stores_the_text_and_returns_the_stored_note():
    """Happy path: the note reaches the repository and comes back to the caller."""
    repository = StubRepository()

    note = note_service.create_note(SESSION, "Buy milk", repository=repository)

    assert repository.added_texts == ["Buy milk"]
    assert note.text == "Buy milk"


def test_create_note_trims_surrounding_whitespace_before_storing():
    """Edge case: padding is stripped, so no note is stored with stray spaces."""
    repository = StubRepository()

    note = note_service.create_note(SESSION, "  Walk the dog \n", repository=repository)

    assert repository.added_texts == ["Walk the dog"]
    assert note.text == "Walk the dog"


@pytest.mark.parametrize("blank_text", ["", "   ", "\t\n "])
def test_create_note_with_blank_text_raises_empty_note_error(blank_text: str):
    """Error case: blank and whitespace-only text is rejected, nothing is stored."""
    repository = StubRepository()

    with pytest.raises(EmptyNoteError) as exc_info:
        note_service.create_note(SESSION, blank_text, repository=repository)

    assert repository.added_texts == []
    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "Note text must not be empty."
    assert isinstance(exc_info.value, AppException)


def test_list_notes_returns_every_note_from_the_repository():
    """Happy path: the service passes the repository's notes through unchanged."""
    repository = StubRepository([StubNote("first"), StubNote("second")])

    notes = note_service.list_notes(SESSION, repository=repository)

    assert [note.text for note in notes] == ["first", "second"]
    assert repository.list_all_calls == 1


def test_list_notes_returns_empty_list_when_none_exist():
    """Edge case: an empty store yields an empty list, never None."""
    repository = StubRepository()

    assert note_service.list_notes(SESSION, repository=repository) == []
