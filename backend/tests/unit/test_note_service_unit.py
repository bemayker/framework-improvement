"""Unit tests for the note service (backend/app/services/note_service.py).

The repository is mocked, so no database is involved (testing_standards.md
Section 1.1).
"""

from datetime import UTC, datetime

import pytest

from app.models.note import Note
from app.services import note_service

SAMPLE_NOTE = Note(id=1, text="Buy milk", created_at=datetime(2026, 7, 31, 9, 15, tzinfo=UTC))


class FakeConnection:
    """Records the transactional calls the service makes; no database behind it."""

    def __init__(self) -> None:
        self.commits = 0
        self.rollbacks = 0

    def commit(self) -> None:
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1


def test_create_note_returns_the_stored_note_and_commits(monkeypatch):
    """Happy path: the inserted note is returned and the transaction committed."""
    connection = FakeConnection()
    monkeypatch.setattr(
        note_service.note_repository, "insert_note", lambda conn, text: SAMPLE_NOTE
    )

    result = note_service.create_note(connection, "Buy milk")

    assert result == SAMPLE_NOTE
    assert connection.commits == 1
    assert connection.rollbacks == 0


def test_create_note_stores_the_text_verbatim(monkeypatch):
    """Edge case: the service does not re-strip or otherwise rewrite the text.

    Stripping is the request schema's job; a service that stripped again would
    silently diverge from what validation accepted.
    """
    connection = FakeConnection()
    received: list[str] = []

    def fake_insert(conn, text: str) -> Note:
        received.append(text)
        return SAMPLE_NOTE

    monkeypatch.setattr(note_service.note_repository, "insert_note", fake_insert)

    note_service.create_note(connection, "a note with  inner   spaces")

    assert received == ["a note with  inner   spaces"]


def test_create_note_rolls_back_and_reraises_when_the_insert_fails(monkeypatch):
    """Error case: a failing insert is rolled back, never committed, and propagates."""
    connection = FakeConnection()

    def failing_insert(conn, text: str) -> Note:
        raise RuntimeError("connection lost")

    monkeypatch.setattr(note_service.note_repository, "insert_note", failing_insert)

    with pytest.raises(RuntimeError):
        note_service.create_note(connection, "Buy milk")

    assert connection.rollbacks == 1
    assert connection.commits == 0


def test_list_notes_returns_the_repository_rows_in_order(monkeypatch):
    """Happy path: the service passes the repository's ordering through untouched."""
    connection = FakeConnection()
    second = Note(id=2, text="Walk the dog", created_at=SAMPLE_NOTE.created_at)
    monkeypatch.setattr(
        note_service.note_repository, "select_notes", lambda conn: [SAMPLE_NOTE, second]
    )

    assert note_service.list_notes(connection) == [SAMPLE_NOTE, second]


def test_list_notes_returns_empty_list_when_none_exist(monkeypatch):
    """Edge case: no notes yields an empty list, not None."""
    connection = FakeConnection()
    monkeypatch.setattr(note_service.note_repository, "select_notes", lambda conn: [])

    assert note_service.list_notes(connection) == []


def test_list_notes_does_not_commit_a_read(monkeypatch):
    """Edge case: listing is read-only, so it opens no transactional boundary."""
    connection = FakeConnection()
    monkeypatch.setattr(note_service.note_repository, "select_notes", lambda conn: [])

    note_service.list_notes(connection)

    assert connection.commits == 0
    assert connection.rollbacks == 0


def test_list_notes_reraises_when_the_query_fails(monkeypatch):
    """Error case: a failing read propagates rather than degrading to an empty list."""
    connection = FakeConnection()

    def failing_select(conn) -> list[Note]:
        raise RuntimeError("connection lost")

    monkeypatch.setattr(note_service.note_repository, "select_notes", failing_select)

    with pytest.raises(RuntimeError):
        note_service.list_notes(connection)
