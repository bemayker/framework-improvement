"""Repository integration tests: NoteRepository against real PostgreSQL
(`CLAUDE.md` Integration Tests, `testing_standards.md` Section 1.2)."""

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.note import Note
from app.repositories.note_repository import NoteRepository


def test_add_then_list_all_returns_the_inserted_note(db_session):
    """Happy path: insert + retrieve round-trip."""
    repository = NoteRepository(db_session)

    repository.add("Buy milk")
    db_session.commit()

    notes = repository.list_all()

    assert len(notes) == 1
    assert notes[0].text == "Buy milk"


def test_list_all_orders_notes_newest_first(db_session):
    """Query behaviour: results are ordered newest first."""
    repository = NoteRepository(db_session)

    repository.add("first")
    db_session.flush()
    repository.add("second")
    db_session.commit()

    notes = repository.list_all()

    assert [note.text for note in notes] == ["second", "first"]


def test_list_all_returns_empty_list_when_no_notes_exist(db_session):
    """Edge case: an empty table returns an empty list, not an error."""
    repository = NoteRepository(db_session)

    notes = repository.list_all()

    assert notes == []


def test_add_note_with_null_text_raises_integrity_error(db_session):
    """Error case: the not-null constraint on `text` is enforced by the database."""
    repository = NoteRepository(db_session)
    db_session.add(Note(text=None))

    with pytest.raises(IntegrityError):
        db_session.flush()
