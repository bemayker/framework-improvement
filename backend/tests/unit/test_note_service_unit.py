"""Unit tests for the note service (backend/app/services/note_service.py).

The repository is stubbed in memory; no database is involved
(testing_standards.md Section 1.1).
"""

import logging

import pytest

from app.models.note import Note
from app.services import note_service


class RecordingRepository:
    """In-memory stand-in for NoteRepository that records what it was asked to store."""

    def __init__(self, notes: list[Note] | None = None) -> None:
        self.notes: list[Note] = list(notes or [])
        self.inserted_texts: list[str] = []

    def insert_note(self, text: str) -> Note:
        self.inserted_texts.append(text)
        note = Note(id=len(self.notes) + 1, text=text)
        self.notes.append(note)
        return note

    def list_notes(self) -> list[Note]:
        return list(self.notes)

    def get_note(self, note_id: int) -> Note | None:
        return next((note for note in self.notes if note.id == note_id), None)

    def count_notes(self) -> int:
        return len(self.notes)

    def delete_note(self, note_id: int) -> bool:
        remaining =[note for note in self.notes if note.id != note_id]
        found = len(remaining) != len(self.notes)
        self.notes = remaining
        return found


class FailingRepository:
    """Stand-in for an unreachable database."""

    def insert_note(self, text: str) -> Note:
        raise RuntimeError("database unreachable")

    def list_notes(self) -> list[Note]:
        raise RuntimeError("database unreachable")

    def get_note(self, note_id: int) -> Note | None:
        raise RuntimeError("database unreachable")

    def count_notes(self) -> int:
        raise RuntimeError("database unreachable")

    def delete_note(self, note_id: int) -> bool:
        raise RuntimeError("database unreachable")


def test_create_note_returns_the_stored_note():
    """Happy path: the note the repository stored is returned verbatim."""
    repository = RecordingRepository()

    note = note_service.create_note(repository, "Buy milk")

    assert note == Note(id=1, text="Buy milk")
    assert repository.inserted_texts == ["Buy milk"]


def test_create_note_trims_surrounding_whitespace_before_storing():
    """Edge case: padding never reaches the database (plan assumption 1)."""
    repository = RecordingRepository()

    note = note_service.create_note(repository, "  Buy milk\n")

    assert repository.inserted_texts == ["Buy milk"]
    assert note.text == "Buy milk"


def test_create_note_propagates_repository_failure_and_logs_it(caplog):
    """Error case: a storage failure is logged with context and re-raised."""
    with caplog.at_level(logging.ERROR, logger=note_service.__name__):
        with pytest.raises(RuntimeError, match="database unreachable"):
            note_service.create_note(FailingRepository(), "Buy milk")

    assert "Storing a note failed" in caplog.text


def test_list_notes_returns_every_stored_note_in_insertion_order():
    """Happy path: the repository's ordering is passed through untouched."""
    stored = [Note(id=1, text="Buy milk"), Note(id=2, text="Walk dog")]

    assert note_service.list_notes(RecordingRepository(stored)) == stored


def test_list_notes_returns_empty_list_when_none_exist():
    """Edge case: an empty table yields an empty list, never None."""
    assert note_service.list_notes(RecordingRepository()) == []


def test_list_notes_propagates_repository_failure_and_logs_it(caplog):
    """Error case: a read failure is logged with context and re-raised."""
    with caplog.at_level(logging.ERROR, logger=note_service.__name__):
        with pytest.raises(RuntimeError, match="database unreachable"):
            note_service.list_notes(FailingRepository())

    assert "Listing notes failed" in caplog.text


def test_get_note_returns_the_stored_note():
    """Happy path: the note stored under that id is returned verbatim."""
    stored = [Note(id=1, text="Buy milk"), Note(id=2, text="Walk dog")]

    assert note_service.get_note(RecordingRepository(stored), 2) == stored[1]


def test_get_note_returns_none_when_note_does_not_exist():
    """Edge case: an unknown id is a miss (None), not an error."""
    assert note_service.get_note(RecordingRepository(), 999) is None


def test_get_note_propagates_repository_failure_and_logs_it(caplog):
    """Error case: a read failure is logged with the id and re-raised."""
    with caplog.at_level(logging.ERROR, logger=note_service.__name__):
        with pytest.raises(RuntimeError, match="database unreachable"):
            note_service.get_note(FailingRepository(), 7)

    assert "Reading a note failed (id 7)" in caplog.text


def test_count_notes_returns_the_number_of_stored_notes():
    """Happy path: the repository's count is passed through untouched."""
    stored = [Note(id=1, text="Buy milk"), Note(id=2, text="Walk dog")]

    assert note_service.count_notes(RecordingRepository(stored)) == 2


def test_count_notes_returns_zero_when_none_exist():
    """Edge case: an empty table counts 0, never None."""
    assert note_service.count_notes(RecordingRepository()) == 0


def test_count_notes_propagates_repository_failure_and_logs_it(caplog):
    """Error case: a count failure is logged with context and re-raised."""
    with caplog.at_level(logging.ERROR, logger=note_service.__name__):
        with pytest.raises(RuntimeError, match="database unreachable"):
            note_service.count_notes(FailingRepository())

    assert "Counting notes failed" in caplog.text


def test_delete_note_returns_true_and_removes_the_note():
    """Happy path: an existing note is deleted and the service reports it."""
    stored = [Note(id=1, text="Buy milk"), Note(id=2, text="Walk dog")]
    repository = RecordingRepository(stored)

    assert note_service.delete_note(repository, 1) is True
    assert repository.notes == [stored[1]]


def test_delete_note_returns_false_when_note_does_not_exist():
    """Edge case: an unknown id is a miss (False) and leaves stored notes untouched."""
    stored = [Note(id=1, text="Buy milk")]
    repository = RecordingRepository(stored)

    assert note_service.delete_note(repository, 999) is False
    assert repository.notes == stored


def test_delete_note_propagates_repository_failure_and_logs_it(caplog):
    """Error case: a delete failure is logged with the id and re-raised."""
    with caplog.at_level(logging.ERROR, logger=note_service.__name__):
        with pytest.raises(RuntimeError, match="database unreachable"):
            note_service.delete_note(FailingRepository(), 7)

    assert "Deleting a note failed (id 7)" in caplog.text
