"""Integration tests for NoteRepository (TEST-03) against real PostgreSQL.

Each test runs in a transaction that is rolled back (see conftest.db_session),
so the tests are order-independent. Rows committed by earlier runs are cleared
*inside* that transaction where a test needs a known-empty table, which keeps
the assertions deterministic without touching the database's real contents.
"""

import pytest
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.note import Note
from app.repositories.note_repository import NoteRepository


@pytest.fixture
def repository(db_session: Session) -> NoteRepository:
    return NoteRepository(db_session)


def _clear_notes(session: Session) -> None:
    session.execute(delete(Note))


def test_add_then_list_all_returns_the_stored_note(
    repository: NoteRepository, db_session: Session
):
    """Happy path: an inserted note round-trips with its generated fields."""
    _clear_notes(db_session)

    created = repository.add("Buy milk")

    assert created.id is not None
    assert created.created_at is not None
    assert [(note.id, note.text) for note in repository.list_all()] == [
        (created.id, "Buy milk")
    ]


def test_list_all_returns_notes_newest_first(
    repository: NoteRepository, db_session: Session
):
    """Ordering: the most recently inserted note comes first.

    All three rows share one transaction timestamp in PostgreSQL, so this also
    proves the descending-id tiebreaker orders them.
    """
    _clear_notes(db_session)
    first = repository.add("Buy milk")
    second = repository.add("Call the dentist")
    third = repository.add("Water the plants")

    assert [note.id for note in repository.list_all()] == [
        third.id,
        second.id,
        first.id,
    ]


def test_list_all_returns_empty_list_when_no_notes_exist(
    repository: NoteRepository, db_session: Session
):
    """Edge case: an empty table yields an empty list."""
    _clear_notes(db_session)

    assert repository.list_all() == []


def test_add_without_text_violates_the_not_null_constraint(
    repository: NoteRepository, db_session: Session
):
    """Constraint violation: the database refuses a note with no text."""
    with pytest.raises(IntegrityError):
        repository.add(None)  # type: ignore[arg-type]

    # The failed flush leaves the session's transaction unusable; rolling back
    # here keeps the fixture teardown clean.
    db_session.rollback()
